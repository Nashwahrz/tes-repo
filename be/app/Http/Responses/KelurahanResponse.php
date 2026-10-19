<?php

namespace App\Http\Responses;


use App\Models\Kelurahan;
use Illuminate\Http\JsonResponse;

class KelurahanResponse
{
    
    public function success(Kelurahan $kelurahan, string $message = 'Kelurahan berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kelurahan,
        ], 200);
    }

    public function list($kelurahans, string $message = 'Data kelurahan berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kelurahans,
        ], 200);
    }

   
    public function notFound(string $message = 'Kelurahan tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Kelurahan berhasil dihapus.'): JsonResponse
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
            'message' => 'Kelurahan sudah terdaftar.',
            'errors'  => ['name' => ['Kelurahan sudah terdaftar.']],
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
