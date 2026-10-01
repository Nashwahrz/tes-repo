<?php

namespace App\Http\Responses;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class OtpResponse
{
    
    public function sent(string $email): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Kode OTP berhasil dikirim ke email ' . $email . '.',
        ], 200);
    }

    public function verified(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Verifikasi OTP berhasil. Akun Anda telah terverifikasi.',
            'data'    => [
                'id'               => $user->id,
                'email'            => $user->email,
                'email_verifikasi' => $user->email_verifikasi,
            ],
        ], 200);
    }

 
    public function invalidOrExpired(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Kode OTP salah atau sudah kedaluwarsa.',
            'errors'  => [
                'otp' => ['Kode OTP tidak valid atau telah kedaluwarsa.'],
            ],
        ], 422);
    }

   
    public function userNotFound(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'User dengan email tersebut tidak ditemukan.',
            'errors'  => [
                'email' => ['Email tidak terdaftar.'],
            ],
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

    
    public function serverError(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Terjadi kesalahan pada server. Silakan coba lagi.',
        ], 500);
    }
}
