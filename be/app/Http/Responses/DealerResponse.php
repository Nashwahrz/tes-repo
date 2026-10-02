<?php

namespace App\Http\Responses;

use App\Models\Dealer;
use Illuminate\Http\JsonResponse;

class DealerResponse
{
    /**
     * Return single dealer success response.
     */
    public function success(Dealer $dealer, string $message = 'Dealer berhasil ditambahkan.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $dealer,
        ], 200);
    }

    /**
     * Return list of dealers response.
     */
    public function list($dealers, string $message = 'Data dealer berhasil diambil.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $dealers,
        ], 200);
    }

    /**
     * Return dealer not found response.
     */
    public function notFound(string $message = 'Dealer tidak ditemukan.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 404);
    }

    /**
     * Return dealer deleted response.
     */
    public function deleted(string $message = 'Dealer berhasil dihapus.'): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
        ], 200);
    }

    /**
     * Return validation error response.
     */
    public function validationError(array $errors): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Data yang dikirim tidak valid.',
            'errors'  => $errors,
        ], 422);
    }

    /**
     * Return name taken response.
     */
    public function nameTaken(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'Nama dealer sudah terdaftar.',
            'errors'  => ['name' => ['Nama dealer sudah terdaftar.']],
        ], 409);
    }

    /**
     * Return server error response.
     */
    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
