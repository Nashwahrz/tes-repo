<?php

namespace App\Services;

use App\Enums\LogAction;
use App\Models\LogActivityPermission;
use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use App\Repositories\LogActivityPermissionRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogActivityPermissionService
{
    public function __construct(
        protected ?LogActivityPermissionRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityPermissionRepository::class);
    }

    public function logRolePermissionsSynced(
        Role $role,
        array $oldPermissions,
        array $newPermissions,
        ?User $actor = null,
        ?string $description = null
    ): ?LogActivityPermission {
        $actor = $actor ?? Auth::user();
        $desc  = $description ?? $this->buildSyncDescription($oldPermissions, $newPermissions, $role, $actor);

        return $this->record([
            'fk_role'     => $role->id,
            'role_name'   => $role->role_name ?? $role->name,
            // 'fk_Permission'     => null,
            // 'Permission_name'   => null,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::Updated,
            'description' => $desc,
            'old_data'    => $oldPermissions,
            'new_data'    => $newPermissions,
        ]);
    }

    public function record(array $payload): LogActivityPermission
    {
        return $this->repository->create([
            'fk_role'     => $payload['fk_role'] ?? null,
            'role_name'   => $payload['role_name'] ?? null,
            // 'fk_Permission'     => $payload['fk_Permission'] ?? null,
            // 'Permission_name'   => $payload['Permission_name'] ?? null,
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

    private function buildSyncDescription(array $oldPermissions, array $newPermissions, Role $role, ?User $actor): string
    {
        $oldMap = [];
        foreach ($oldPermissions as $m) {
            $id = is_array($m) ? ($m['id'] ?? null) : $m->id;
            $name = is_array($m) 
                ? ($m['permission_name'] ?? $m['Permission_name'] ?? "Permission #{$id}") 
                : ($m->permission_name ?? $m->Permission_name ?? "Permission #{$id}");
            if ($id) {
                $oldMap[$id] = $name;
            }
        }

        $newMap = [];
        foreach ($newPermissions as $m) {
            $id = is_array($m) ? ($m['id'] ?? null) : $m->id;
            $name = is_array($m) 
                ? ($m['permission_name'] ?? $m['Permission_name'] ?? "Permission #{$id}") 
                : ($m->permission_name ?? $m->Permission_name ?? "Permission #{$id}");
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
            $changes[] = 'Menambahkan Permission: (' . implode(', ', $addedNames) . ')';
        }
        if (!empty($removedIds)) {
            $removedNames = array_map(fn ($id) => $oldMap[$id], $removedIds);
            $changes[] = 'Menghapus Permission: (' . implode(', ', $removedNames) . ')';
        }

        $roleName = $role->role_name ?? $role->name ?? "Role #{$role->id}";
        $actorName = $actor?->name ?? 'Sistem';

        if (empty($changes)) {
            return sprintf(' %s memperbarui hak akses Permission untuk role %s (tidak ada perubahan Permission)', $actorName, $roleName);
        }

        return sprintf(
            ' %s memperbarui hak akses Permission untuk role %s: %s',
            $actorName,
            $roleName,
            implode('; ', $changes)
        );
    }
}

