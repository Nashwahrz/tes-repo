<?php

namespace App\Http\Controllers;

use App\Http\Responses\MotorUnitResponse;
use App\Repositories\MotorStockRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MotorStockController extends Controller
{
    public function __construct(
        protected MotorStockRepository $repository,
        protected MotorUnitResponse $response,
        protected PaginateController $paginateController
    ) {}

    /**
     * Ambil daftar stok motor terpaginasi dari tabel motor_stocks.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage  = $this->paginateController->getPerPage($request);
            $search   = $request->query('search');
            $dealerId = $request->query('dealer_id') ? (int) $request->query('dealer_id') : null;
            $itemCode = $request->query('item_code');

            $stocks = $this->repository->index($perPage, $search, $dealerId, $itemCode);

            return $this->response->list($stocks, 'Data stok motor berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data stok motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Detail 1 baris stok motor beserta daftar unit fisik di dalamnya.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $stock = $this->repository->findById($id, withUnits: true);

            if (!$stock) {
                return $this->response->notFound('Data stok motor tidak ditemukan.');
            }

            return $this->response->success($stock, 'Detail stok motor berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error("Gagal mengambil detail stok motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }
}
