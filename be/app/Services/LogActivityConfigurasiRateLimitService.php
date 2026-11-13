<?php

namespace App\Services;

use App\Enums\LogAction;
use App\Models\ConfigurasiRateLimit;
use App\Models\LogActivityConfigurasiRateLimit;
use App\Models\User;
use App\Repositories\LogActivityConfigurasiRateLimitRepository;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogActivityConfigurasiRateLimitService
{
    public function __construct(
        protected ?LogActivityConfigurasiRateLimitRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityConfigurasiRateLimitRepository::class);
    }

    public function logUpdated(
        ConfigurasiRateLimit $configurasiRateLimit,
        ?User $actor = null,
        ?array $oldData = null,
        ?array $newData = null,
        ?string $description = null
    ): ?LogActivityConfigurasiRateLimit {
        $actor       = $actor ?? Auth::user();
        $oldFiltered = ($oldData && $newData) ? Arr::only($oldData, array_keys($newData)) : $oldData;
        $newFiltered = $newData ?? $configurasiRateLimit->toArray();

        $desc = $description ?? (
            ($oldFiltered && $newData)
                ? $this->buildChangeDescription($oldFiltered, $newData, $configurasiRateLimit)
                : sprintf('Memperbarui data konfigurasi rate limit: %s', $configurasiRateLimit->name)
        );

        return $this->record([
            'fk_rate_limit'   => $configurasiRateLimit->id,
            'rate_limit_name' => $configurasiRateLimit->name,
            'fk_causer'       => $actor?->id,
            'causer_name'     => $actor?->name ?? 'Sistem',
            'action'          => LogAction::Updated,
            'description'     => $desc,
            'old_data'        => $oldFiltered,
            'new_data'        => $newFiltered,
        ]);
    }

    private function buildChangeDescription(array $old, array $new, ConfigurasiRateLimit $rateLimit): string
    {
        $changes = [];
        foreach ($new as $key => $newVal) {
            $oldVal = $old[$key] ?? null;
            if ($oldVal != $newVal) {
                $changes[] = sprintf('%s: "%s" -> "%s"', $key, $this->formatValue($oldVal), $this->formatValue($newVal));
            }
        }

        if (empty($changes)) {
            return sprintf('Memperbarui data konfigurasi rate limit: %s', $rateLimit->name);
        }

        return sprintf('Memperbarui konfigurasi rate limit %s (%s)', $rateLimit->name, implode(', ', $changes));
    }
  
    public function record(array $payload): LogActivityConfigurasiRateLimit
    {
        return $this->repository->create([
            'fk_rate_limit'     => $payload['fk_rate_limit'] ?? null,
            'rate_limit_name'   => $payload['rate_limit_name'] ?? null,
            'fk_causer'   => $payload['fk_causer'] ?? null,
            'causer_name' => $payload['causer_name'] ?? null,
            'action'      => $payload['action'],
            'description' => $payload['description'],
            'old_data'   => $payload['old_data'] ?? null,
            'new_data'   => $payload['new_data'] ?? null,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }


    
    private function formatValue(mixed $value): string
    {
        if ($value === null) {
            return '(kosong)';
        }

        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }

}

