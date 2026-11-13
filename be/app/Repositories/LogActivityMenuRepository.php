<?php

namespace App\Repositories;

use App\Models\LogActivityMenu;
use Illuminate\Pagination\LengthAwarePaginator;

class LogActivityMenuRepository
{
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return LogActivityMenu::query()
            ->with(['role:id,role_name', 'menu:id,menu_name', 'causer:id,name,email'])
            ->when($search, function ($q) use ($search) {
                $q->where('role_name', 'ILIKE', "%{$search}%")
                  ->orWhere('menu_name', 'ILIKE', "%{$search}%")
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
    //     return LogActivityMenu::query()
    //         ->with(['role:id,role_name', 'menu:id,menu_name', 'causer:id,name,email'])
    //         ->where('fk_role', $roleId)
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }

    public function create(array $data): LogActivityMenu
    {
        return LogActivityMenu::create($data);
    }
}

