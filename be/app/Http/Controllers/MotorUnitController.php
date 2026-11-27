<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportRequest;
use App\Http\Requests\MotorUnitActionRequest;
use App\Http\Requests\MotorUnitRequest;
use App\Http\Responses\ImportResponse;
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
        protected ImportResponse $importResponse,
        protected PaginateController $paginateController
    ) {}

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

    public function logs(Request $request): JsonResponse
    {
        try {
            $perPage         = $this->paginateController->getPerPage($request);
            $search          = $request->query('search');
            $dealerId        = $request->query('dealer_id') ? (int) $request->query('dealer_id') : null;
            $itemCode        = $request->query('item_code');
            $jenisPergerakan = $request->query('jenis_pergerakan');
            $motorUnitId     = $request->query('motor_unit_id') ? (int) $request->query('motor_unit_id') : null;

            $logs = $this->repository->getAllMovements(
                $perPage,
                $search,
                $dealerId,
                $itemCode,
                $jenisPergerakan,
                $motorUnitId
            );

            return $this->response->list($logs, 'Daftar log pergerakan unit motor berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log pergerakan unit motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function import(ImportRequest $request): JsonResponse
    {
        try {
            $filePath = $request->file('file')->getRealPath();
            $userId   = $request->user()?->id;
            $result   = $this->service->importFromExcel($filePath, $userId);

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            return $this->importResponse->success($result, 'Unit Fisik Motor');
        } catch (Throwable $e) {
            Log::error('Gagal import unit fisik motor dari Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import unit fisik motor. Silakan coba lagi.');
        }
    }
}
