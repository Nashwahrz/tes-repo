<?php

namespace App\Http\Responses;

use App\Models\Pekerjaan;
use Illuminate\Http\JsonResponse;

class PekerjaanResponse
{
    
    public function success(Pekerjaan $pekerjaan, string $message = 'Pekerjaan berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $pekerjaan,
        ], 200);
    }

    public function list($pekerjaans, string $message = 'Data pekerjaan berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $pekerjaans,
        ], 200);
    }

   
    public function notFound(string $message = 'Pekerjaan tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Pekerjaan berhasil dihapus.'): JsonResponse
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
            'message' => 'Pekerjaan sudah terdaftar.',
            'errors'  => ['name' => ['Pekerjaan sudah terdaftar.']],
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
