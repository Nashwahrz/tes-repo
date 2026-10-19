<?php

namespace App\Http\Responses;

use App\Models\KabupatenKota;
use Illuminate\Http\JsonResponse;

class KabupatenKotaResponse
{
    
    public function success(KabupatenKota $kabupatenKota, string $message = 'Kabupaten Kota berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kabupatenKota,
        ], 200);
    }

    public function list($kabupatenKotas, string $message = 'Data kabupaten kota berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $kabupatenKotas,
        ], 200);
    }

   
    public function notFound(string $message = 'Kabupaten Kota tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Kabupaten Kota berhasil dihapus.'): JsonResponse
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
            'message' => 'Kabupaten Kota sudah terdaftar.',
            'errors'  => ['name' => ['Kabupaten Kota sudah terdaftar.']],
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
