<?php

namespace App\Repositories;

use App\Models\LogActivityPermission;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityPermissionRepository
{
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return LogActivityPermission::query()
            ->with(['role:id,role_name', 'permission:id,permission_name', 'causer:id,name,email'])
            ->when($search, function ($q) use ($search) {
                $q->where('role_name', 'ILIKE', "%{$search}%")
                  ->orWhere('permission_name', 'ILIKE', "%{$search}%")
                  ->orWhere('causer_name', 'ILIKE', "%{$search}%")
                  ->orWhere('description', 'ILIKE', "%{$search}%")
                  ->orWhere('action', 'ILIKE', "%{$search}%");
            })
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    // public function paginateByRoleId(int|string $roleId, int $perPage = 10): LengthAwarePaginator
    // {
    //     return LogActivityPermission::query()
    //         ->with(['role:id,role_name', 'Permission:id,Permission_name', 'causer:id,name,email'])
    //         ->where('fk_role', $roleId)
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    public function create(array $data): LogActivityPermission
    {
        return LogActivityPermission::create($data);
    }
}

