<?php

namespace App\Repositories;

use App\Models\LogBlockedUser;
use Illuminate\Pagination\LengthAwarePaginator;

class LogBlockedUserRepository
{
    public function paginate(
        int $perPage = 10,
        ?string $search = null,
        ?string $type = null,
        ?string $status = null
    ): LengthAwarePaginator {
        return LogBlockedUser::query()
            ->with('unblocker')
            ->when($search, function ($q) use ($search) {
                $q->where(function ($query) use ($search) {
                    $query->where('email', 'like', "%{$search}%")
                        ->orWhere('ip_address', 'like', "%{$search}%");
                });
            })
            ->when($type, fn ($q) => $q->where('type', $type))
            ->when($status, function ($q) use ($status) {
                if ($status === 'aktif' || $status === 'active') {
                    $q->where('is_unblocked', false)->where('blocked_until', '>', now());
                } elseif ($status === 'dibuka' || $status === 'unlocked') {
                    $q->where('is_unblocked', true);
                } elseif ($status === 'kedaluwarsa' || $status === 'expired') {
                    $q->where('is_unblocked', false)->where('blocked_until', '<=', now());
                }
            })
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    // public function getActiveBlocks(?string $search = null)
    // {
    //     return LogBlockedUser::query()
    //         ->with('unblocker')
    //         ->where('is_unblocked', false)
    //         ->where('blocked_until', '>', now())
    //         ->when($search, function ($q) use ($search) {
    //             $q->where(function ($query) use ($search) {
    //                 $query->where('email', 'like', "%{$search}%")
    //                     ->orWhere('ip_address', 'like', "%{$search}%");
    //             });
    //         })
    //         ->orderByDesc('blocked_until')
    //         ->get();
    // }

    public function recordBlock(
        string $ip,
        ?string $email,
        string $type,
        string $reason,
        int $decaySeconds,
        int $attempts = 1
    ): LogBlockedUser {
        $normalizedEmail = $email ? strtolower(trim($email)) : null;

        $existing = LogBlockedUser::where('ip_address', $ip)
            ->when($normalizedEmail, fn ($q) => $q->where('email', $normalizedEmail))
            ->where('type', $type)
            ->where('is_unblocked', false)
            ->where('blocked_until', '>', now())
            ->latest('id')
            ->first();

        if ($existing) {
            $existing->update([
                'attempts'      => max($existing->attempts + 1, $attempts),
                'blocked_until' => now()->addSeconds($decaySeconds),
                'reason'        => $reason,
            ]);

            return $existing->fresh();
        }

        return LogBlockedUser::create([
            'ip_address'    => $ip,
            'email'         => $normalizedEmail,
            'type'          => $type,
            'reason'        => $reason,
            'attempts'      => $attempts,
            'blocked_at'    => now(),
            'blocked_until' => now()->addSeconds($decaySeconds),
            'is_unblocked'  => false,
        ]);
    }

    public function findById(int $id): ?LogBlockedUser
    {
        return LogBlockedUser::with('unblocker')->find($id);
    }

    public function unblock(LogBlockedUser $log, ?int $adminId = null): LogBlockedUser
    {
        $log->update([
            'is_unblocked' => true,
            'unblocked_at' => now(),
            'unblocked_by' => $adminId,
        ]);

        return $log->fresh();
    }

    // public function unblockByTarget(?string $email, ?string $ip, ?int $adminId = null): int
    // {
    //     $normalizedEmail = $email ? strtolower(trim($email)) : null;

    //     $query = LogBlockedUser::where('is_unblocked', false);

    //     if ($normalizedEmail && $ip) {
    //         $query->where(function ($q) use ($normalizedEmail, $ip) {
    //             $q->where('email', $normalizedEmail)->orWhere('ip_address', $ip);
    //         });
    //     } elseif ($normalizedEmail) {
    //         $query->where('email', $normalizedEmail);
    //     } elseif ($ip) {
    //         $query->where('ip_address', $ip);
    //     } else {
    //         return 0;
    //     }

    //     return $query->update([
    //         'is_unblocked' => true,
    //         'unblocked_at' => now(),
    //         'unblocked_by' => $adminId,
    //     ]);
    // }
}
