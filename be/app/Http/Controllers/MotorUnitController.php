<?php

namespace App\Http\Controllers;

use App\Http\Requests\MotorUnitActionRequest;
use App\Http\Requests\MotorUnitRequest;
use App\Http\Responses\MotorUnitResponse;
use App\Repositories\MotorUnitRepository;
use App\Services\MotorUnitService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class MotorUnitController extends Controller
{
    public function __construct(
        protected MotorUnitRepository $repository,
        protected MotorUnitService $service,
        protected MotorUnitResponse $response,
        protected PaginateController $paginateController
    ) {}

    /**
     * Ambil daftar seluruh unit fisik motor terpaginasi (filter nomor rangka, nomor mesin, dealer, status).
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage  = $this->paginateController->getPerPage($request);
            $search   = $request->query('search');
            $dealerId = $request->query('dealer_id') ? (int) $request->query('dealer_id') : null;
            $itemCode = $request->query('item_code');
            $stockId  = $request->query('stock_id') ? (int) $request->query('stock_id') : null;
            $status   = $request->query('status');

            $units = $this->repository->index($perPage, $search, $dealerId, $itemCode, $stockId, $status);

            return $this->response->list($units, 'Daftar unit fisik motor berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar unit motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Detail 1 unit fisik motor beserta riwayat mutasinya.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $unit = $this->repository->findById($id, withMovements: true);

            if (!$unit) {
                return $this->response->notFound('Unit fisik motor tidak ditemukan.');
            }

            return $this->response->success($unit, 'Detail unit fisik motor berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error("Gagal mengambil detail unit fisik motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Input penerimaan unit fisik motor baru dari AHM (nomor rangka & nomor mesin).
     */
    public function store(MotorUnitRequest $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id;
            $unit   = $this->service->addUnit($request->validated(), $userId);

            return $this->response->success($unit, 'Unit fisik motor baru berhasil diinput ke sistem.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan unit fisik motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Perbarui data unit fisik motor.
     */
    public function update(MotorUnitRequest $request, int $id): JsonResponse
    {
        try {
            $userId = $request->user()?->id;
            $unit   = $this->service->updateUnit($id, $request->validated(), $userId);

            return $this->response->success($unit, 'Data unit fisik motor berhasil diperbarui.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal memperbarui unit motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Hapus unit fisik motor (hanya jika belum terjual).
     */
    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()?->id;
            $this->service->deleteUnit($id, $userId);

            return $this->response->deleted('Unit fisik motor berhasil dihapus.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal menghapus unit fisik motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Kunci unit fisik motor saat proses penjualan dimulai.
     */
    public function lock(MotorUnitActionRequest $request, int $id): JsonResponse
    {
        try {
            $validated     = $request->validated();
            $userId        = $request->user()?->id;
            $dikunciSampai = !empty($validated['dikunci_sampai']) ? Carbon::parse($validated['dikunci_sampai']) : null;

            $unit = $this->service->reserveUnit(
                unitId: $id,
                userId: $userId,
                dikunciSampai: $dikunciSampai,
                catatan: $validated['catatan'] ?? null,
            );

            return $this->response->success($unit, 'Unit fisik motor berhasil dikunci untuk proses penjualan.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal mengunci unit fisik motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Lepas kunci unit fisik motor jika penjualan dibatalkan, kembali ke AVAILABLE.
     */
    public function unlock(MotorUnitActionRequest $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validated();
            $userId    = $request->user()?->id;

            $unit = $this->service->releaseUnit(
                unitId: $id,
                userId: $userId,
                catatan: $validated['catatan'] ?? null,
            );

            return $this->response->success($unit, 'Kunci unit fisik motor berhasil dilepas dan kembali AVAILABLE.');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal melepas kunci unit motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Finalisasi penjualan unit fisik motor (status menjadi SOLD).
     */
    public function sell(MotorUnitActionRequest $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validated();
            $userId    = $request->user()?->id;

            $unit = $this->service->sellUnit(
                unitId: $id,
                userId: $userId,
                catatan: $validated['catatan'] ?? null,
            );

            return $this->response->success($unit, 'Penjualan unit fisik motor berhasil diselesaikan (SOLD).');
        } catch (RuntimeException $e) {
            return $this->response->error($e->getMessage(), 422);
        } catch (Throwable $e) {
            Log::error("Gagal menjual unit motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    /**
     * Ambil riwayat mutasi / pergerakan unit fisik motor.
     */
    public function movements(int $id, Request $request): JsonResponse
    {
        try {
            $unit = $this->repository->findById($id);
            if (!$unit) {
                return $this->response->notFound('Unit fisik motor tidak ditemukan.');
            }

            $perPage   = $this->paginateController->getPerPage($request);
            $movements = $this->repository->getMovements($id, $perPage);

            return $this->response->list($movements, 'Riwayat mutasi unit fisik motor berhasil diambil.');
        } catch (Throwable $e) {
            Log::error("Gagal mengambil riwayat mutasi unit motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }
}
