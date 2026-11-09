<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class RegisterResponse
{
    /**
     * Create a new class instance.
     */
    public function success(User $user): JsonResponse
    {
        return response()->json([
            'message' => 'Registrasi berhasil.Silahkan cek email anda untuk verifikasi kode otp.',
            'data'    => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'status'    => $user->status,
                'fk_dealer' => $user->fk_dealer,
                'fk_atasan' => $user->fk_atasan,
                'fk_role'   => $user->fk_role,
            ],
            // 'token'   => $token,
        ], 200);
    }
    public function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $errors,
        ], 422);
    }

    public function emailTaken(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Email sudah terdaftar.',
            'errors'  => ['email' => ['Email sudah terdaftar.']],
        ], 409);
    }

    public function serverError(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server. Silakan coba lagi.',
        ], 500);
    }
}
