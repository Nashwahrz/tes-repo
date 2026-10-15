<?php

namespace App\Http\Responses;


use Illuminate\Http\JsonResponse;

class LogUserResponse
{
    public function list($users, string $message = 'Data user berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $users,
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
