<?php

namespace App\Http\Responses;

use App\Models\Provinsi;
use Illuminate\Http\JsonResponse;

class ProvinsiResponse
{
    
    public function success(Provinsi $provinsi, string $message = 'Provinsi berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $provinsi,
        ], 200);
    }

    public function list($provinsis, string $message = 'Data provinsi berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $provinsis,
        ], 200);
    }

   
    public function notFound(string $message = 'Provinsi tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Provinsi berhasil dihapus.'): JsonResponse
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
            'message' => 'Provinsi sudah terdaftar.',
            'errors'  => ['name' => ['Provinsi sudah terdaftar.']],
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
