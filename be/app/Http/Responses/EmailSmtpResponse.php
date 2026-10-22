<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use App\Models\EmailSmtp;

class EmailSmtpResponse
{
    
    public function success(EmailSmtp $emailSmtp, string $message = 'EmailSmtp berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $emailSmtp,
        ], 200);
    }

    public function list($emailSmtp, string $message = 'Data EmailSmtp berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $emailSmtp,
        ], 200);
    }

   
    public function notFound(string $message = 'EmailSmtp tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    public function deleted(string $message = 'EmailSmtp berhasil dihapus.'): JsonResponse
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

    
    // public function nameTaken(): JsonResponse
    // {
    //     return response()->json([
    //         'success' => false,
    //         'message' => 'EmailSmtp sudah terdaftar.',
    //         'errors'  => ['name' => ['EmailSmtp sudah terdaftar.']],
    //     ], 409);
    // }

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
