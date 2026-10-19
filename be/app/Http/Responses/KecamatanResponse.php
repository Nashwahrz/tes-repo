<?php

namespace App\Http\Responses;

use App\Models\Kecamatan;
use Illuminate\Http\JsonResponse;

class KecamatanResponse
{
    
    public function success(Kecamatan $kecamatan, string $message = 'Kecamatan berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kecamatan,
        ], 200);
    }

    public function list($kecamatans, string $message = 'Data kecamatan berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kecamatans,
        ], 200);
    }

   
    public function notFound(string $message = 'Kecamatan tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Kecamatan berhasil dihapus.'): JsonResponse
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
            'message' => 'Kecamatan sudah terdaftar.',
            'errors'  => ['name' => ['Kecamatan sudah terdaftar.']],
        ], 409);
    }

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
