<?php

namespace App\Http\Responses;

use App\Models\ConfigurasiRateLimit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConfigurasiRateLimitResponse
{
    
    public function success(ConfigurasiRateLimit $configurasiRateLimit, string $message = 'Configurasi Rate Limit berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $configurasiRateLimit,
        ], 200);
    }

    public function list($configurasiRateLimits, string $message = 'Data Configurasi Rate Limit berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $configurasiRateLimits,
        ], 200);
    }

   
    public function notFound(string $message = 'Configurasi Rate Limit tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Configurasi Rate Limit berhasil dihapus.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
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

    
    public function nameTaken(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Nama konfigurasi rate limit sudah terdaftar.',
            'errors'  => ['name' => ['Nama konfigurasi rate limit sudah terdaftar.']],
        ], 409);
    }

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }

    public function tooManyAttempts(?Request $request = null, array $headers = []): JsonResponse
    {
        $retryAfter = (int) ($headers['Retry-After'] ?? 0);

        return response()->json([
            'success'     => false,
            'message'     => 'Terlalu banyak percobaan. Silakan coba lagi dalam ' . $retryAfter . ' detik.',
            'retry_after' => $retryAfter,
            'retry_at'    => now()->addSeconds($retryAfter)->toDateTimeString(),
        ], 429, $headers);
    }
}
