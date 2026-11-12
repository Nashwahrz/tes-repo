<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class LogActivityKonsumenResponse
{
    public function list($data, string $message = 'Daftar log aktivitas konsumen berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}

