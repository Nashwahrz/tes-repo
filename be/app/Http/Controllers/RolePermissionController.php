<?php

namespace App\Http\Controllers;

use App\Http\Requests\RolePermissionRequest;
use App\Http\Responses\RolePermissionResponse;
use App\Repositories\RolePermissionRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class RolePermissionController extends Controller
{
    public function __construct(
        private RolePermissionRepository $rolePermissionRepository,
        private RolePermissionResponse $rolePermissionResponse
    ) {}

   
    public function index()
    {
        try {
            $roles = $this->rolePermissionRepository->getAllRolesWithPermissions();
            $permissions = $this->rolePermissionRepository->getAllPermissions();

            return $this->rolePermissionResponse->list([
                'roles'       => $roles,
                'permissions' => $permissions,
            ], 'Data pengaturan permission role berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data pengaturan permission role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->rolePermissionResponse->serverError();
        }
    }

    public function getPermissions()
    {
        try {
            $permissions = $this->rolePermissionRepository->getAllPermissions();

            return $this->rolePermissionResponse->list($permissions, 'Daftar master permission berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil master permission: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->rolePermissionResponse->serverError();
        }
    }

   
    public function show(int $roleId)
    {
        try {
            $role = $this->rolePermissionRepository->findRoleById($roleId);

            if (!$role) {
                return $this->rolePermissionResponse->notFound('Role tidak ditemukan.');
            }

            $allPermissions = $this->rolePermissionRepository->getAllPermissions();

            return $this->rolePermissionResponse->rolePermissions($role, $allPermissions);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail hak akses permission role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->rolePermissionResponse->serverError();
        }
    }

   
    public function update(RolePermissionRequest $request, int $roleId)
    {
        try {
            $role = $this->rolePermissionRepository->findRoleById($roleId);

            if (!$role) {
                return $this->rolePermissionResponse->notFound('Role tidak ditemukan.');
            }

            $permissionIds = $request->validated('permission_ids', []);
            $updatedRole = $this->rolePermissionRepository->syncRolePermissions($role, $permissionIds);

            return $this->rolePermissionResponse->rolePermissions(
                $updatedRole,
                null,
                'Hak akses permission role berhasil diperbarui.'
            );
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui permission role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->rolePermissionResponse->serverError();
        }
    }

   
    public function userPermissions(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->id_role) {
                return $this->rolePermissionResponse->list([], 'User tidak memiliki role.');
            }

            $permissions = $this->rolePermissionRepository->getPermissionsByRoleId($user->id_role);

            return $this->rolePermissionResponse->list($permissions, 'Daftar permission user berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil permission user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->rolePermissionResponse->serverError();
        }
    }
}
