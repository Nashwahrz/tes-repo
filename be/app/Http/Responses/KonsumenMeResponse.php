<?php

namespace App\Http\Responses;

use App\Models\KonsumenMe;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class KonsumenMeResponse
{
    
    public function success(KonsumenMe $konsumen, string $message = 'Data konsumen berhasil ditambahkan.'): JsonResponse
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

    public function serverError(string $message = 'Terjadi kesalahan pada server. Silakan coba lagi.'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
    public function paginated(LengthAwarePaginator $paginator, string $message = 'Data konsumen berhasil diambil.')
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ],
        ]);
    }
}
