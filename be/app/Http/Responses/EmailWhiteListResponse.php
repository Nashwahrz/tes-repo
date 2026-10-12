<?php

namespace App\Http\Responses;


use App\Models\EmailWhitelist;
use Illuminate\Http\JsonResponse;

class EmailWhiteListResponse
{
    
    public function success(EmailWhiteList $email, string $message = 'Domain email berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $email,
        ], 200);
    }

    public function list($emails, string $message = 'Data domain email berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $emails,
        ], 200);
    }


    public function notFound(string $message = 'Domain email tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }


    public function deleted(string $message = 'Domain email berhasil dihapus.'): JsonResponse
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
            'message' => 'Domain email sudah terdaftar.',
            'errors'  => ['domain' => ['Domain email sudah terdaftar.']],
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
