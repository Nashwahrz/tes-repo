<?php

namespace App\Repositories;


use App\Models\LogActivityConfigurasiRateLimit;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityConfigurasiRateLimitRepository
{
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return LogActivityConfigurasiRateLimit::query()
            ->with(['rateLimit:id,name', 'causer:id,name,email'])
            ->when($search, function ($q) use ($search) {
                $q->where('rate_limit_name', 'ILIKE', "%{$search}%")
                  ->orWhere('causer_name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('action', 'ILIKE', "%{$search}%");
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    
    public function paginateByUserId(int $userId, int $perPage = 10): LengthAwarePaginator
    {
        return LogActivityConfigurasiRateLimit::query()
            ->with(['rateLimit:id,name', 'causer:id,name,email'])
            ->where('fk_rate_limit', $userId)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

 
    public function create(array $data): LogActivityConfigurasiRateLimit
    {
        return LogActivityConfigurasiRateLimit::create($data);
    }
}

