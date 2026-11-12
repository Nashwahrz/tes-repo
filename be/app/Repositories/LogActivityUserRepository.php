<?php

namespace App\Repositories;

use App\Models\LogActivityUser;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityUserRepository
{
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return LogActivityUser::query()
            ->with(['user:id,name,email', 'causer:id,name,email'])
            ->when($search, function ($q) use ($search) {
                $q->where('user_name', 'ILIKE', "%{$search}%")
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
        return LogActivityUser::query()
            ->with(['user:id,name,email', 'causer:id,name,email'])
            ->where('fk_user', $userId)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

 
    public function create(array $data): LogActivityUser
    {
        return LogActivityUser::create($data);
    }
}

