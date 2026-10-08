<?php

namespace App\Repositories;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleMenuRepository
{
         
    public function getAllRolesWithMenus(): Collection
    {
        return Role::with(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }])->get();
    }

    public function findRoleById(int|string $id): ?Role
    {
        return Role::with(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }])->find($id);
    }

    
    public function getAllMenus(bool $onlyActive = false): Collection
    {
        $query = Menu::orderBy('urutan', 'asc');

        if ($onlyActive) {
            $query->where('status', true);
        }

        return $query->get();
    }

    public function getMenusByRoleId(int|string $roleId): Collection
    {
        $role = Role::find($roleId);

        if (!$role) {
            return new Collection();
        }

        return $role->menus()
            ->where('status', true)
            ->orderBy('urutan', 'asc')
            ->get();
    }


    public function syncRoleMenus(Role $role, array $menuIds): Role
    {
        $role->menus()->sync($menuIds);

        return $role->fresh(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }]);
    }
}
