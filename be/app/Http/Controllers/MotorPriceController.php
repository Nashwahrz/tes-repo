<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportRequest;
use App\Http\Requests\MotorPriceRequest;
use App\Http\Responses\ImportResponse;
use App\Http\Responses\MotorPriceResponse;
use App\Repositories\MotorPriceRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MotorPriceController extends Controller
{
    public function __construct(
        protected MotorPriceRepository $repository,
        protected MotorPriceResponse $response,
        protected ImportResponse $importResponse,
        protected PaginateController $paginateController
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $perPage       = $this->paginateController->getPerPage($request);
            $search        = $request->query('search');
            $tahunProduksi = $request->query('tahun_produksi') ? (int) $request->query('tahun_produksi') : null;
            $itemCode      = $request->query('item_code');
            $status        = null;

            if ($request->has('status') && $request->query('status') !== '') {
                $rawStatus = strtolower(trim((string) $request->query('status')));
                if (in_array($rawStatus, ['aktif', '1', 'true'], true)) {
                    $status = true;
                } elseif (in_array($rawStatus, ['non-aktif', 'nonaktif', '0', 'false'], true)) {
                    $status = false;
                }
            }

            $prices = $this->repository->index($perPage, $search, $tahunProduksi, $itemCode, $status);

            return $this->response->list($prices);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar master harga motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function store(MotorPriceRequest $request): JsonResponse
    {
        try {
            $price = $this->repository->create($request->validated());

            return $this->response->success($price->load('motor'), 'Master harga motor berhasil ditambahkan.');
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan master harga motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $price = $this->repository->findById($id);

            if (!$price) {
                return $this->response->notFound();
            }

            return $this->response->success($price, 'Data master harga motor berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error("Gagal mengambil detail master harga motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function update(MotorPriceRequest $request, int $id): JsonResponse
    {
        try {
            $price = $this->repository->findById($id);

            if (!$price) {
                return $this->response->notFound();
            }

            $updated = $this->repository->update($price, $request->validated());

            return $this->response->success($updated, 'Master harga motor berhasil diperbarui.');
        } catch (Throwable $e) {
            Log::error("Gagal memperbarui master harga motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function status(Request $request, int $id): JsonResponse
    {
        try {
            $price = $this->repository->findById($id);

            if (!$price) {
                return $this->response->notFound();
            }

            $raw = strtolower(trim((string) $request->input('status', '')));
            if (in_array($raw, ['aktif', '1', 'true'], true)) {
                $newStatus = true;
            } elseif (in_array($raw, ['non-aktif', 'nonaktif', '0', 'false'], true)) {
                $newStatus = false;
            } else {
                $currentIsActive = $price->getRawOriginal('status');
                $newStatus = !filter_var($currentIsActive, FILTER_VALIDATE_BOOLEAN);
            }

            $updated = $this->repository->update($price, ['status' => $newStatus]);

            return $this->response->success($updated, 'Status master harga motor berhasil diubah.');
        } catch (Throwable $e) {
            Log::error("Gagal mengubah status master harga motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $price = $this->repository->findById($id);

            if (!$price) {
                return $this->response->notFound();
            }

            $this->repository->delete($price);

            return $this->response->deleted();
        } catch (Throwable $e) {
            Log::error("Gagal menghapus master harga motor ID {$id}: " . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->response->serverError();
        }
    }

    public function import(ImportRequest $request): JsonResponse
    {
        try {
            $filePath = $request->file('file')->getRealPath();
            $result   = $this->repository->importFromExcel($filePath);

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            return $this->importResponse->success($result, 'Master Harga Motor');
        } catch (Throwable $e) {
            Log::error('Gagal import master harga motor dari Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import master harga motor. Silakan coba lagi.');
        }
    }
}
