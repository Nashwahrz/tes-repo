<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use App\Models\UrlIpLogin;

class UrlIpResponse
{
    
    public function success(UrlIpLogin $urlIpLogin, string $message = 'UrlIpLogin berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $urlIpLogin,
        ], 200);
    }

    public function list($urlIpLogin, string $message = 'Data UrlIpLogin berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $urlIpLogin,
        ], 200);
    }

   
    public function notFound(string $message = 'UrlIpLogin tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'UrlIpLogin berhasil dihapus.'): JsonResponse
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
