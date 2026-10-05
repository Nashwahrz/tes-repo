<?php

namespace App\Repositories;

use App\Models\Menu;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RoleMenuRepository
{
    /**
     * Get all roles with their assigned menus.
     */
    public function getAllRolesWithMenus(): Collection
    {
        return Role::with(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }])->get();
    }

    /**
     * Find a role by its ID with assigned menus.
     */
    public function findRoleById(int|string $id): ?Role
    {
        return Role::with(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }])->find($id);
    }

    /**
     * Get all master menus sorted by sequence (urutan).
     */
    public function getAllMenus(bool $onlyActive = false): Collection
    {
        $query = Menu::orderBy('urutan', 'asc');

        if ($onlyActive) {
            $query->where('status', true);
        }

        return $query->get();
    }

    /**
     * Get assigned active menus for a specific role ID.
     */
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

    /**
     * Sync menu IDs assigned to a role.
     *
     * @param Role $role
     * @param array<int> $menuIds
     */
    public function syncRoleMenus(Role $role, array $menuIds): Role
    {
        $role->menus()->sync($menuIds);

        return $role->fresh(['menus' => function ($query) {
            $query->orderBy('urutan', 'asc');
        }]);
    }
}
