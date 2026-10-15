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

    public function alreadyVerified(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Email sudah aktif dan terverifikasi.',
        ], 200);
    }
    public function notreadyVerified(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Email belum aktif dan terverifikasi.',
        ], 422);
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
    public function purposeMismatch(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Kode OTP tidak sesuai dengan tujuan.',
            'errors'  => [
                'otp' => ['Kode OTP tidak sesuai dengan tujuan.'],
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
    public function resetTokenIssued(string $resetToken): JsonResponse
    {
        return response()->json([
            'success'     => true,
            'message'     => 'Kode OTP valid. Silakan lanjutkan penggantian password.',
            'reset_token' => $resetToken,
        ], 200);
    }
    public function invalidResetToken(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Token reset password tidak valid atau telah kedaluwarsa. Silakan minta kode OTP baru.',
            'errors'  => [
                'reset_token' => ['Token reset password tidak valid atau kedaluwarsa.'],
            ],
        ], 422);
    }

    public function passwordResetSuccess(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diubah. Silakan login kembali dengan password baru Anda.',
        ], 200);
    }


}
