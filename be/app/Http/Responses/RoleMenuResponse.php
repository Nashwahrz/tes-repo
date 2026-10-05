<?php

namespace App\Http\Responses;

use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RoleMenuResponse
{
    /**
     * Return standard success response.
     */
    public function success(mixed $data, string $message = 'Pengaturan menu role berhasil diperbarui.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

    /**
     * Return list response.
     */
    public function list(mixed $data, string $message = 'Data pengaturan menu role berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

    /**
     * Return single role with menu access response.
     */
    public function roleMenus(Role $role, mixed $allMenus = null, string $message = 'Data hak akses menu role berhasil diambil.'): JsonResponse
    {
        $response = [
            'id'        => $role->id,
            'name'      => $role->name,
            'menu_ids'  => $role->menus->pluck('id')->values(),
            'menus'     => $role->menus,
        ];

        if ($allMenus !== null) {
            $response['available_menus'] = $allMenus;
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $response,
        ], 200);
    }

    /**
     * Return not found response.
     */
    public function notFound(string $message = 'Role tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    /**
     * Return validation error response.
     */
    public function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $errors,
        ], 422);
    }

    /**
     * Return forbidden response.
     */
    public function forbidden(string $message = 'Akses ditolak.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }

    /**
     * Return server error response.
     */
    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
