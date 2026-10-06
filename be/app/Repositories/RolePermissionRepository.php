<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;

class RolePermissionRepository
{
    
    public function getAllRolesWithPermissions(): Collection
    {
        return Role::with(['permissions' => function ($query) {
            $query->orderBy('nama_permission', 'asc');
        }])->get();
    }

    
    public function findRoleById(int|string $id): ?Role
    {
        return Role::with(['permissions' => function ($query) {
            $query->orderBy('nama_permission', 'asc');
        }])->find($id);
    }

    
    public function getAllPermissions(): Collection
    {
        return Permission::orderBy('nama_permission', 'asc')->get();
    }


    public function getPermissionsByRoleId(int|string $roleId): Collection
    {
        $role = Role::find($roleId);

        if (!$role) {
            return new Collection();
        }

        return $role->permissions()
            ->orderBy('nama_permission', 'asc')
            ->get();
    }

    public function syncRolePermissions(Role $role, array $permissionIds): Role
    {
        $role->permissions()->sync($permissionIds);

        return $role->fresh(['permissions' => function ($query) {
            $query->orderBy('nama_permission', 'asc');
        }]);
    }
}
