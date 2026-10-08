<?php

namespace App\Http\Responses;

use App\Models\Konsumen;
use Illuminate\Http\JsonResponse;

class KonsumenResponse
{
    
    public function success(Konsumen $konsumen, string $message = 'Data konsumen berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $konsumen,
        ], 200);
    }

    public function list($konsumens, string $message = 'Data konsumen berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $konsumens,
        ], 200);
    }

  
    public function notFound(string $message = 'Data konsumen tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

   
    public function deleted(string $message = 'Data konsumen berhasil dihapus.'): JsonResponse
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

    public function scanSuccess(array $data, string $message = 'KTP berhasil dipindai.'): JsonResponse
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
