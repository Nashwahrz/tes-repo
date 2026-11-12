<?php

namespace App\Repositories;

use App\Enums\LogOtpAction;
use App\Enums\OtpPurpose;
use App\Models\LogActivityOtp;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityOtpRepository
{
    public function paginate(
        int $perPage = 10,
        ?string $search = null,
        ?OtpPurpose $purpose = null,
        ?LogOtpAction $action = null
    ): LengthAwarePaginator {
        return LogActivityOtp::query()
            ->with(['user:id,name,email'])
            ->when($purpose, fn ($q) => $q->where('purpose', $purpose))
            ->when($action, fn ($q) => $q->where('action', $action))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('email', 'ILIKE', "%{$search}%")
                        ->orWhere('description', 'ILIKE', "%{$search}%")
                        ->orWhereHas('user', fn ($uq) => $uq->where('name', 'ILIKE', "%{$search}%"));
                });
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function paginateByUserId(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return LogActivityOtp::query()
            ->where('fk_user', $userId)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function create(array $data): LogActivityOtp
    {
        return LogActivityOtp::create($data);
    }
}

