<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\LogUserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LoginLogService
{
    
    private const MAX_ATTEMPTS  = 5;
    private const DECAY_MINUTES = 15;

    public function __construct(
        private LogUserRepository $logUserRepository,
    ) {}

    
    private function throttleKey(string $ip, string $email): string
    {
        return 'login_attempts:' . sha1($ip . '|' . strtolower($email));
    }

    
    private function expireKey(string $ip, string $email): string
    {
        return $this->throttleKey($ip, $email) . ':expire_at';
    }

   
    public function isLocked(string $ip, string $email): bool
    {
        $key = $this->throttleKey($ip, $email);
        return Cache::get($key, 0) >= self::MAX_ATTEMPTS;
    }

    public function incrementAttempts(string $ip, string $email): void
    {
        $key       = $this->throttleKey($ip, $email);
        $expireKey = $this->expireKey($ip, $email);
        $current   = Cache::get($key, 0);
        $expiresAt = now()->addMinutes(self::DECAY_MINUTES);

        Cache::put($key, $current + 1, $expiresAt);


        if ($current === 0) {
            Cache::put($expireKey, $expiresAt->timestamp, $expiresAt);
        }
    }

   
    public function clearAttempts(string $ip, string $email): void
    {
        Cache::forget($this->throttleKey($ip, $email));
        Cache::forget($this->expireKey($ip, $email));
    }

   
    public function remainingAttempts(string $ip, string $email): int
    {
        $key  = $this->throttleKey($ip, $email);
        $used = Cache::get($key, 0);
        return max(0, self::MAX_ATTEMPTS - $used);
    }

   
    public function secondsUntilUnlock(string $ip, string $email): int
    {
        $expireAt = Cache::get($this->expireKey($ip, $email));

        if ($expireAt !== null) {
            $remaining = (int) $expireAt - now()->timestamp;
            return max(0, $remaining);
        }

        return self::DECAY_MINUTES * 60;
    }

   
    public function maxAttempts(): int
    {
        return self::MAX_ATTEMPTS;
    }

    

    public function log(User $user, Request $request): void
    {
        try {
            $ip     = $request->ip();
            $ua     = $request->userAgent() ?? '';
            $parsed = $this->parseUserAgent($ua);
            $geo    = $this->getGeoData($ip);

            $this->logUserRepository->create($user, [
                'ip_address' => $ip,
                'browser'    => $parsed['browser'],
                'platform'   => $parsed['platform'],
                'device'     => $parsed['device'],
                'city'       => $geo['city']      ?? null,
                'region'     => $geo['region']    ?? null,
                'country'    => $geo['country']   ?? null,
                'latitude'   => $geo['latitude']  ?? null,
                'longitude'  => $geo['longitude'] ?? null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Gagal menyimpan log login: ' . $e->getMessage());
        }
    }

    
    private function parseUserAgent(string $ua): array
    {
        $browser  = 'Unknown';
        $platform = 'Unknown';
        $device   = 'Desktop';

        $browsers = [
            'Edg'     => 'Microsoft Edge',
            'OPR'     => 'Opera',
            'Opera'   => 'Opera',
            'Chrome'  => 'Chrome',
            'Safari'  => 'Safari',
            'Firefox' => 'Firefox',
            'MSIE'    => 'Internet Explorer',
            'Trident' => 'Internet Explorer',
        ];
        foreach ($browsers as $key => $name) {
            if (str_contains($ua, $key)) {
                $browser = $name;
                break;
            }
        }

        $platforms = [
            'Windows NT 10.0' => 'Windows 10/11',
            'Windows NT 6.3'  => 'Windows 8.1',
            'Windows NT 6.1'  => 'Windows 7',
            'Windows'         => 'Windows',
            'Macintosh'       => 'macOS',
            'Linux'           => 'Linux',
            'Android'         => 'Android',
            'iPhone'          => 'iOS',
            'iPad'            => 'iPadOS',
        ];
        foreach ($platforms as $key => $name) {
            if (str_contains($ua, $key)) {
                $platform = $name;
                break;
            }
        }

    
        if (preg_match('/Mobile|Android|iPhone|iPod/i', $ua)) {
            $device = 'Mobile';
        } elseif (preg_match('/iPad|Tablet/i', $ua)) {
            $device = 'Tablet';
        }

        return compact('browser', 'platform', 'device');
    }

  
    private function getGeoData(string $ip): array
    {
        if ($this->isPrivateIp($ip)) {
            return [
                'city'      => 'Local',
                'region'    => 'Local',
                'country'   => 'Local',
                'latitude'  => null,
                'longitude' => null,
            ];
        }

        try {
            $response = Http::timeout(3)->get("http://ip-api.com/json/{$ip}", [
                'fields' => 'status,city,regionName,country,lat,lon',
            ]);

            if ($response->successful() && $response->json('status') === 'success') {
                $data = $response->json();
                return [
                    'city'      => $data['city']       ?? null,
                    'region'    => $data['regionName'] ?? null,
                    'country'   => $data['country']    ?? null,
                    'latitude'  => $data['lat']        ?? null,
                    'longitude' => $data['lon']        ?? null,
                ];
            }
        } catch (\Throwable $e) {
            Log::warning('Geolokasi gagal untuk IP ' . $ip . ': ' . $e->getMessage());
        }

        return [];
    }

    private function isPrivateIp(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) === false;
    }
}
