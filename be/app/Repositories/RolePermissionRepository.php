<?php

namespace App\Repositories;

use App\Models\Permission;
use App\Models\PermissionRole;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class RolePermissionRepository
{
    
    public function getAllRolesWithPermissions(): Collection
    {
        return Role::with(['permissions' => function ($query) {
            $query->orderBy('permission_name', 'asc');
        }])->get();
    }

    
    public function findRoleById(int|string $id): ?Role
    {
        return Role::with(['permissions' => function ($query) {
            $query->orderBy('permission_name', 'asc');
        }])->find($id);
    }

    
    public function getAllPermissions(): Collection
    {
        return Permission::orderBy('permission_name', 'asc')->get();
    }


    public function getPermissionsByRoleId(int|string $roleId): Collection
    {
        $role = Role::find($roleId);

        if (!$role) {
            return new Collection();
        }

        return $role->permissions()
            ->orderBy('permission_name', 'asc')
            ->get();
    }

    public function syncRolePermissions(Role $role, array $permissionIds): Role
    {
        return DB::transaction(function () use ($role, $permissionIds) {
            $currentPermissionIds = PermissionRole::where('fk_role', $role->id)->pluck('fk_permission')->toArray();

            $detachIds = array_diff($currentPermissionIds, $permissionIds);
            $attachIds = array_diff($permissionIds, $currentPermissionIds);

            if (!empty($detachIds)) {
                PermissionRole::where('fk_role', $role->id)
                    ->whereIn('fk_permission', $detachIds)
                    ->get()
                    ->each(fn ($permissionRole) => $permissionRole->delete());
            }
            foreach ($attachIds as $permissionId) {
                PermissionRole::create([
                    'fk_role'       => $role->id,
                    'fk_permission' => $permissionId,
                ]);
            }

            return $role->fresh(['permissions' => function ($query) {
                $query->orderBy('permission_name', 'asc');
            }]);
        });
    }

    public function getAllPermissionRoleLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', PermissionRole::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($sub) use ($search) {
                    $sub->where('description', 'ILIKE', "%{$search}%")
                        ->orWhere('properties', 'ILIKE', "%{$search}%")
                        ->orWhereHas('causer', function ($causerQ) use ($search) {
                            $causerQ->where('name', 'ILIKE', "%{$search}%");
                        });
                });
            })
            ->latest('id')
            ->paginate($perPage);

        return $logs;
    }
    public function getAllPermissionLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Permission::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Permission::class], function ($q) use ($search) {
                            $q->where('permission_name', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
}
