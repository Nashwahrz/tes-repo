<?php

namespace App\Http\Controllers;


use App\Http\Requests\ConfigurasiRateLimitRequest;
use App\Http\Responses\ConfigurasiRateLimitResponse;
use App\Repositories\ConfigurasiRateLimitRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ConfigurasiRateLimitController extends Controller
{
    public function __construct(
        private ConfigurasiRateLimitRepository $configurasiRateLimitRepository,
        private ConfigurasiRateLimitResponse $configurasiRateLimitResponse
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
            $configurasiRateLimits = $this->configurasiRateLimitRepository->paginate($perPage, $request->query('search'));
            return $this->configurasiRateLimitResponse->list($configurasiRateLimits);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data konfigurasi rate limit: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->configurasiRateLimitResponse->serverError();
        }
    }

    
    // public function store(ConfigurasiRateLimitRequest $request)
    // {
    //     try {   
    //         $configurasiRateLimit = $this->configurasiRateLimitRepository->create($request->validated());
    //         return $this->configurasiRateLimitResponse->success($configurasiRateLimit, 'Configurasi rate limit berhasil ditambahkan.');
    //     } catch (UniqueConstraintViolationException $e) {
    //         return $this->configurasiRateLimitResponse->nameTaken();
    //     } catch (Throwable $e) {
    //         Log::error('Gagal menambahkan konfigurasi rate limit: ' . $e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return $this->configurasiRateLimitResponse->serverError();
    //     }
    // }

    public function show(int $id)
    {
        try {
            $configurasiRateLimit = $this->configurasiRateLimitRepository->findById($id);

            if (!$configurasiRateLimit) {
                return $this->configurasiRateLimitResponse->notFound();
            }

            return $this->configurasiRateLimitResponse->success($configurasiRateLimit, 'Data konfigurasi rate limit berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail konfigurasi rate limit: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->configurasiRateLimitResponse->serverError();
        }
    }

    public function update(ConfigurasiRateLimitRequest $request, int $id)
    {
        try {
            $configurasiRateLimit = $this->configurasiRateLimitRepository->findById($id);

            if (!$configurasiRateLimit) {
                return $this->configurasiRateLimitResponse->notFound();
            }

            $updatedConfigurasiRateLimit = $this->configurasiRateLimitRepository->update($configurasiRateLimit, $request->validated());

            return $this->configurasiRateLimitResponse->success($updatedConfigurasiRateLimit, 'Configurasi rate limit berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->configurasiRateLimitResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui konfigurasi rate limit: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->configurasiRateLimitResponse->serverError();
        }
    }

    // public function destroy(int $id)
    // {
    //     try {
    //         $configurasiRateLimit = $this->configurasiRateLimitRepository->findById($id);

    //         if (!$configurasiRateLimit) {
    //             return $this->configurasiRateLimitResponse->notFound();
    //         }

    //         $this->configurasiRateLimitRepository->delete($configurasiRateLimit);

    //         return $this->configurasiRateLimitResponse->deleted('Configurasi rate limit berhasil dihapus.');
    //     } catch (Throwable $e) {
    //         Log::error('Gagal menghapus konfigurasi rate limit: ' . $e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return $this->configurasiRateLimitResponse->serverError();
    //     }
    // }
}
