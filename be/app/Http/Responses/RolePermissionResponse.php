<?php

namespace App\Http\Responses;

use App\Models\Role;
use Illuminate\Http\JsonResponse;

class RolePermissionResponse
{
    
    public function success(mixed $data, string $message = 'Pengaturan permission role berhasil diperbarui.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

   
    public function list(mixed $data, string $message = 'Data pengaturan permission role berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

    public function rolePermissions(Role $role, mixed $allPermissions = null, string $message = 'Data hak akses permission role berhasil diambil.'): JsonResponse
    {
        $response = [
            'id'             => $role->id,
            'name'           => $role->name,
            'permission_ids' => $role->permissions->pluck('id')->values(),
            'permissions'    => $role->permissions,
        ];

        if ($allPermissions !== null) {
            $response['available_permissions'] = $allPermissions;
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $response,
        ], 200);
    }


    public function notFound(string $message = 'Role tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $errors,
        ], 422);
    }

    public function forbidden(string $message = 'Akses ditolak.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
    }


    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
