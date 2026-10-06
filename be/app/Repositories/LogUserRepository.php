<?php

namespace App\Repositories;

use App\Models\LogUser;
use App\Models\User;
use Illuminate\Support\Carbon;

class LogUserRepository
{
 
    public function create(User $user, array $data): LogUser
    {
        return LogUser::create([
            'id_user'      => $user->id,
            'ip_address'   => $data['ip_address'],
            'browser'      => $data['browser']   ?? null,
            'platform'     => $data['platform']  ?? null,
            'device'       => $data['device']    ?? null,
            'city'         => $data['city']      ?? null,
            'region'       => $data['region']    ?? null,
            'country'      => $data['country']   ?? null,
            'latitude'     => $data['latitude']  ?? null,
            'longitude'    => $data['longitude'] ?? null,
            'logged_in_at' => now(),
        ]);
    }

   
    public function countFailedAttemptsByIp(string $ip, int $minutes = 15): int
    {
        return 0;
    }

    public function getByUser(int $userId, int $limit = 10)
    {
        return LogUser::where('id_user', $userId)
            ->orderByDesc('logged_in_at')
            ->limit($limit)
            ->get();
    }
}
