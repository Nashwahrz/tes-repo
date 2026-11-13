<?php

namespace App\Services;

use App\Enums\LogAction;
use App\Models\LogActivityMenu;
use App\Models\Menu;
use App\Models\Role;
use App\Models\User;
use App\Repositories\LogActivityMenuRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogActivityMenuService
{
    public function __construct(
        protected ?LogActivityMenuRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityMenuRepository::class);
    }

    public function logRoleMenusSynced(
        Role $role,
        array $oldMenus,
        array $newMenus,
        ?User $actor = null,
        ?string $description = null
    ): ?LogActivityMenu {
        $actor = $actor ?? Auth::user();
        $desc  = $description ?? $this->buildSyncDescription($oldMenus, $newMenus, $role, $actor);

        return $this->record([
            'fk_role'     => $role->id,
            'role_name'   => $role->role_name ?? $role->name,
            // 'fk_menu'     => null,
            // 'menu_name'   => null,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::Updated,
            'description' => $desc,
            'old_data'    => $oldMenus,
            'new_data'    => $newMenus,
        ]);
    }

    public function record(array $payload): LogActivityMenu
    {
        return $this->repository->create([
            'fk_role'     => $payload['fk_role'] ?? null,
            'role_name'   => $payload['role_name'] ?? null,
            // 'fk_menu'     => $payload['fk_menu'] ?? null,
            // 'menu_name'   => $payload['menu_name'] ?? null,
            'fk_causer'   => $payload['fk_causer'] ?? null,
            'causer_name' => $payload['causer_name'] ?? null,
            'action'      => $payload['action'],
            'description' => $payload['description'] ?? null,
            'old_data'    => $payload['old_data'] ?? null,
            'new_data'    => $payload['new_data'] ?? null,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }

    private function buildSyncDescription(array $oldMenus, array $newMenus, Role $role, ?User $actor): string
    {
        $oldMap = [];
        foreach ($oldMenus as $m) {
            $id = is_array($m) ? ($m['id'] ?? null) : $m->id;
            $name = is_array($m) ? ($m['menu_name'] ?? "Menu #{$id}") : $m->menu_name;
            if ($id) {
                $oldMap[$id] = $name;
            }
        }

        $newMap = [];
        foreach ($newMenus as $m) {
            $id = is_array($m) ? ($m['id'] ?? null) : $m->id;
            $name = is_array($m) ? ($m['menu_name'] ?? "Menu #{$id}") : $m->menu_name;
            if ($id) {
                $newMap[$id] = $name;
            }
        }

        $oldIds = array_keys($oldMap);
        $newIds = array_keys($newMap);

        $addedIds   = array_diff($newIds, $oldIds);
        $removedIds = array_diff($oldIds, $newIds);

        $changes = [];
        if (!empty($addedIds)) {
            $addedNames = array_map(fn ($id) => $newMap[$id], $addedIds);
            $changes[] = 'Menambahkan menu: (' . implode(', ', $addedNames) . ')';
        }
        if (!empty($removedIds)) {
            $removedNames = array_map(fn ($id) => $oldMap[$id], $removedIds);
            $changes[] = 'Menghapus menu: (' . implode(', ', $removedNames) . ')';
        }

        $roleName = $role->role_name ?? $role->name ?? "Role #{$role->id}";
        $actorName = $actor?->name ?? 'Sistem';

        if (empty($changes)) {
            return sprintf('%s memperbarui hak akses menu untuk role %s (tidak ada perubahan menu)', $actorName, $roleName);
        }

        return sprintf(
            '%s memperbarui hak akses menu untuk role %s: %s',
            $actorName,
            $roleName,
            implode('; ', $changes)
        );
    }
}

