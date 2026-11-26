<?php

namespace App\Http\Controllers;

use App\Http\Requests\PenjualanActionRequest;
use App\Http\Requests\PenjualanRequest;
use App\Http\Responses\PenjualanResponse;
use App\Repositories\PenjualanRepository;
use App\Services\PenjualanService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PenjualanController extends Controller
{
    public function __construct(
        protected PenjualanRepository $repository,
        protected PenjualanService $service,
        protected PenjualanResponse $response,
        protected PaginateController $paginateController
    ) {}

    /**
     * Ambil daftar transaksi penjualan terpaginasi dengan pencarian dan filter.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage  = $this->paginateController->getPerPage($request);
            $search   = $request->query('search');
            $dealerId = $request->query('dealer_id') ? (int) $request->query('dealer_id') : null;
            $status   = $request->query('status');
            $from     = $request->query('from');
            $to       = $request->query('to');

            $items = $this->repository->index($perPage, $search, $dealerId, $status, $from, $to);

            return $this->response->list($items);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar penjualan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Ambil ringkasan KPI penjualan (total transaksi, unit terjual, omzet).
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $dealerId = $request->query('dealer_id') ? (int) $request->query('dealer_id') : null;
            $from     = $request->query('from');
            $to       = $request->query('to');

            $summary = $this->repository->getSummary($dealerId, $from, $to);

            return $this->response->summary($summary);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil ringkasan penjualan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Buat transaksi penjualan baru dan otomatis kunci unit fisik motor yang dipilih.
     */
    public function store(PenjualanRequest $request): JsonResponse
    {
        try {
            $salesId   = (int) $request->user()->id;
            $penjualan = $this->service->create($request->validated(), $salesId);

            return $this->response->success($penjualan, 'Transaksi penjualan berhasil dibuat dan unit motor telah dikunci.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error('Gagal membuat transaksi penjualan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Ambil detail 1 transaksi penjualan.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $penjualan = $this->repository->findById($id);

            if (!$penjualan) {
                return $this->response->notFound();
            }

            return $this->response->success($penjualan, 'Detail transaksi penjualan berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error("Gagal mengambil detail penjualan ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Konfirmasi pelunasan transaksi dan otomatis selesaikan unit (SOLD).
     */
    public function lunas(PenjualanActionRequest $request, int $id): JsonResponse
    {
        try {
            $penjualan = $this->repository->findById($id);
            if (!$penjualan) {
                return $this->response->notFound();
            }

            $kasirId   = (int) $request->user()->id;
            $validated = $request->validated();

            $updated = $this->service->lunas($id, $kasirId, $validated['catatan'] ?? null);

            return $this->response->success($updated, 'Pembayaran penjualan berhasil dilunasi dan unit motor berstatus SOLD.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal melunasi penjualan ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Batalkan transaksi penjualan dan otomatis lepas kunci unit kembali ke AVAILABLE.
     */
    public function batal(PenjualanActionRequest $request, int $id): JsonResponse
    {
        try {
            $penjualan = $this->repository->findById($id);
            if (!$penjualan) {
                return $this->response->notFound();
            }

            $actorId   = (int) $request->user()->id;
            $validated = $request->validated();

            $updated = $this->service->batal($id, $actorId, $validated['alasan_batal'] ?? $validated['catatan'] ?? null);

            return $this->response->success($updated, 'Transaksi penjualan dibatalkan dan kunci unit motor telah dilepas.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal membatalkan penjualan ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }
}
