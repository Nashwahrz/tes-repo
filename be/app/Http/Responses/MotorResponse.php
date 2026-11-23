<?php

namespace App\Http\Responses;

use App\Models\Motor;
use Illuminate\Http\JsonResponse;

class MotorResponse
{
    public function success(Motor $motor, string $message = 'Data motor berhasil disimpan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $motor,
        ], 200);
    }

    public function list($motors, string $message = 'Data motor berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $motors,
        ], 200);
    }

    public function notFound(string $message = 'Data motor tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'Data motor berhasil dihapus.'): JsonResponse
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

    public function itemTaken(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Kode item motor sudah terdaftar.',
            'errors'  => ['item_code' => ['Kombinasi kode tipe dan kode warna sudah terdaftar.']],
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