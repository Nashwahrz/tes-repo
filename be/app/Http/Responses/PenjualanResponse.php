<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class PenjualanResponse
{
    public function success(mixed $data, string $message = 'Data penjualan berhasil disimpan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data,
        ], 200);
    }

    public function list(mixed $items, string $message = 'Data penjualan berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $items,
        ], 200);
    }

    public function summary(array $summary, string $message = 'Ringkasan penjualan berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $summary,
        ], 200);
    }

    public function notFound(string $message = 'Data penjualan tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function error(string $message = 'Permintaan tidak dapat diproses.', int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], $statusCode);
    }

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
