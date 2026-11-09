<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserResponse
{
    /**
     * Return user success response.
     */
    public function success(User $user, string $message = 'Akun user berhasil diaktifkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => [
                'id'               => $user->id,
                'name'             => $user->name,
                'email'            => $user->email,
                'status'           => $user->status,
                'email_verifikasi' => $user->email_verification,
                'fk_dealer'        => $user->fk_dealer,
                'dealer'           => $user->dealer ? [
                    'id'     => $user->dealer->id,
                    'name'   => $user->dealer->dealer_name,
                    'alamat' => $user->dealer->address,
                ] : null,
                'fk_role'          => $user->fk_role,
                'role'             => $user->role ? [
                    'id'   => $user->role->id,
                    'name' => $user->role->role_name,
                ] : null,
                'fk_atasan'        => $user->fk_atasan,
                'atasan'           => $user->atasan ? [
                    'id'   => $user->atasan->id,
                    'name' => $user->atasan->name,
                ] : null,
            ],
        ], 200);
    }

    /**
     * Return list of users response.
     */
    public function list($users, string $message = 'Data user berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $users,
        ], 200);
    }

    /**
     * Return user not found response.
     */
    public function notFound(string $message = 'User tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    /**
     * Return forbidden response for non-.
     */
    public function forbidden(string $message = 'Akses ditolak. Hanya  yang dapat melakukan tindakan ini.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 403);
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
