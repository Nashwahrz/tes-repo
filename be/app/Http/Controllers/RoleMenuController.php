<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleMenuRequest;
use App\Http\Responses\RoleMenuResponse;
use App\Repositories\RoleMenuRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class RoleMenuController extends Controller
{
    public function __construct(
        private RoleMenuRepository $roleMenuRepository,
        private RoleMenuResponse $roleMenuResponse
    ) {}

    /**
     * Get all roles with their assigned menus and list of all available menus.
     */
    public function index()
    {
        try {
            $roles = $this->roleMenuRepository->getAllRolesWithMenus();
            $menus = $this->roleMenuRepository->getAllMenus();

            return $this->roleMenuResponse->list([
                'roles' => $roles,
                'menus' => $menus,
            ], 'Data pengaturan menu role berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data pengaturan menu role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->roleMenuResponse->serverError();
        }
    }

    /**
     * Get all master menus list.
     */
    public function getMenus()
    {
        try {
            $menus = $this->roleMenuRepository->getAllMenus();

            return $this->roleMenuResponse->list($menus, 'Daftar master menu berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil master menu: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->roleMenuResponse->serverError();
        }
    }

    /**
     * Get assigned menus and available menus for a specific role.
     */
    public function show(int $roleId)
    {
        try {
            $role = $this->roleMenuRepository->findRoleById($roleId);

            if (!$role) {
                return $this->roleMenuResponse->notFound('Role tidak ditemukan.');
            }

            $allMenus = $this->roleMenuRepository->getAllMenus();

            return $this->roleMenuResponse->roleMenus($role, $allMenus);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail hak akses menu role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->roleMenuResponse->serverError();
        }
    }

    /**
     * Update/sync menus assigned to a specific role.
     */
    public function update(RoleMenuRequest $request, int $roleId)
    {
        try {
            $role = $this->roleMenuRepository->findRoleById($roleId);

            if (!$role) {
                return $this->roleMenuResponse->notFound('Role tidak ditemukan.');
            }

            $menuIds = $request->validated('menu_ids', []);
            $updatedRole = $this->roleMenuRepository->syncRoleMenus($role, $menuIds);

            return $this->roleMenuResponse->roleMenus(
                $updatedRole,
                null,
                'Hak akses menu role berhasil diperbarui.'
            );
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui menu role: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->roleMenuResponse->serverError();
        }
    }

    /**
     * Get menus accessible by current logged-in user according to their role.
     */
    public function userMenus(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user || !$user->id_role) {
                return $this->roleMenuResponse->list([], 'User tidak memiliki role.');
            }

            $menus = $this->roleMenuRepository->getMenusByRoleId($user->id_role);

            return $this->roleMenuResponse->list($menus, 'Daftar menu user berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil menu user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->roleMenuResponse->serverError();
        }
    }
}
