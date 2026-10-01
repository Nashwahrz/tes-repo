<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class LoginResponse
{
    /**
     * Create a new class instance.
     */
    public function success(User $user, string $token): JsonResponse
    {
        return response()->json([
            'message' => 'Login berhasil.',
            'data'    => [
                'id'        => $user->id,
                'email'     => $user->email,
            ],
            'token'   => $token,
        ], 200);
    }

    public function unauthorized(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Email atau password salah.',
        ], 401);
    }

    public function inactive(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Akun Anda belum aktif. Silakan hubungi administrator.',
        ], 403);
    }

    public function reject(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Akun Anda ditolak. Silakan hubungi administrator.',
        ], 403);
    }
    public function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $errors,
        ], 422);
    }

    public function serverError(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server. Silakan coba lagi.',
        ], 500);
    }

    
}
