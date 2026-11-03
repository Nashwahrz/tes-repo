<?php

namespace App\Repositories;

use App\Models\Menu;
use App\Models\MenuRole;
use App\Models\Role;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

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
        return DB::transaction(function () use ($role, $menuIds) {
            $currentMenuIds = MenuRole::where('id_role', $role->id)->pluck('id_menu')->toArray();

            $detachIds = array_diff($currentMenuIds, $menuIds);
            $attachIds = array_diff($menuIds, $currentMenuIds);
            if (!empty($detachIds)) {
                MenuRole::where('id_role', $role->id)
                    ->whereIn('id_menu', $detachIds)
                    ->get()
                    ->each(fn ($menuRole) => $menuRole->delete());
            }
            foreach ($attachIds as $menuId) {
                MenuRole::create([
                    'id_role' => $role->id,
                    'id_menu' => $menuId,
                ]);
            }
            return $role->fresh(['menus' => function ($query) {
                $query->orderBy('urutan', 'asc');
            }]);
        });
    }

    public function getAllMenuRoleLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', MenuRole::class)
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
    public function getAllMenuLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Menu::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Menu::class], function ($q) use ($search) {
                            $q->where('nama_menu', 'ILIKE', "%{$search}%")
                            ->orWhere('url', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
}
