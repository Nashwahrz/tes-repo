<?php

namespace App\Http\Responses;

use App\Models\Konsumen;
use Illuminate\Http\JsonResponse;
use Illuminate\Pagination\LengthAwarePaginator;

class KonsumenResponse
{
    
    public function success(Konsumen $konsumen, string $message = 'Data konsumen berhasil ditambahkan.'): JsonResponse
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

    public function scanSuccess(array $data, string $message = 'KTP berhasil dipindai.'): JsonResponse
    {
        return response()->json([
            'success'       => true,
            'is_registered' => false,
            'message'       => $message,
            'data'          => array_merge($data, ['is_registered' => false]),
        ], 200);
    }

    public function scanExisting(Konsumen $konsumen, array $extractedData, string $message = 'Konsumen dengan NIK ini sudah terdaftar.'): JsonResponse
    {
        return response()->json([
            'success'       => true,
            'is_registered' => true,
            'message'       => $message,
            'data'          => [
                'is_registered'     => true,
                'existing_konsumen' => $konsumen,
                'scanned_data'      => $extractedData,
            ],
        ], 200);
    }

    public function searchResult($konsumens, string $keyword): JsonResponse
    {
        $found = $konsumens->isNotEmpty();

        return response()->json([
            'success'       => true,
            'is_registered' => $found,
            'total'         => $konsumens->count(),
            'message'       => $found
                ? "Ditemukan {$konsumens->count()} data konsumen yang cocok."
                : "Tidak ditemukan konsumen dengan kata kunci '{$keyword}'.",
            'data'          => [
                'is_registered'     => $found,
                'list'              => $konsumens,
                // 'existing_konsumen' => $konsumens->first(),
            ],
        ], 200);
    }

    public function nikRegistered(Konsumen $konsumen, string $nik, ?string $message = null): JsonResponse
    {
        return response()->json([
            'success'       => true,
            'is_registered' => true,
            'message'       => $message ?? "Konsumen dengan NIK {$nik} sudah terdaftar atas nama {$konsumen->name}.",
            'data'          => [
                'is_registered'     => true,
                'existing_konsumen' => $konsumen,
            ],
        ], 200);
    }

    public function nikAvailable(string $nik, ?string $message = null): JsonResponse
    {
        return response()->json([
            'success'       => true,
            'is_registered' => false,
            'message'       => $message ?? "NIK {$nik} belum terdaftar dan dapat digunakan.",
            'data'          => [
                'is_registered' => false,
            ],
        ], 200);
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
