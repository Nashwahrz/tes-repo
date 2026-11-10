<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;

class ImportResponse
{
    public function success(array $result, string $label = 'Data'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => "Import {$label} selesai. Berhasil: {$result['success']}, Gagal: {$result['failed']}.",
            'data'    => [
                'success_count' => $result['success'],
                'failed_count'  => $result['failed'],
                'errors'        => $result['errors'],
                'imported'      => $result['imported'],
            ],
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

    public function formatError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Format file Excel tidak sesuai.',
            'errors'  => $errors,
        ], 422);
    }

    public function serverError(string $message = 'Gagal import data. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
