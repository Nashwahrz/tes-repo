<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use App\Models\AppKeyOcr;

class AppKeyOcrResponse
{
    
    public function success(AppKeyOcr $appKeyOcr, string $message = 'AppKeyOcr berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $appKeyOcr,
        ], 200);
    }

    public function list($appKeyOcr, string $message = 'Data AppKeyOcr berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $appKeyOcr,
        ], 200);
    }

   
    public function notFound(string $message = 'AppKeyOcr tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'AppKeyOcr berhasil dihapus.'): JsonResponse
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

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
