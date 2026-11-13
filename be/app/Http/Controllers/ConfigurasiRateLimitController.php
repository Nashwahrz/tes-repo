<?php

namespace App\Http\Controllers;


use App\Http\Requests\ConfigurasiRateLimitRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\LogActivityConfigurasiRateLimitResource;
use App\Http\Responses\ConfigurasiRateLimitResponse;
use App\Http\Responses\LogActivityConfigurasiRateLimitResponse;
use App\Repositories\ConfigurasiRateLimitRepository;
use App\Repositories\LogActivityConfigurasiRateLimitRepository;
use App\Services\LogActivityConfigurasiRateLimitService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ConfigurasiRateLimitController extends Controller
{
    public function __construct(
        private ConfigurasiRateLimitRepository $configurasiRateLimitRepository,
        private ConfigurasiRateLimitResponse $configurasiRateLimitResponse,
        private PaginateController $paginateController,
        private ?LogActivityConfigurasiRateLimitService $logActivityConfigurasiRateLimitService = null,
        private ?LogActivityConfigurasiRateLimitRepository $logActivityConfigurasiRateLimitRepository = null,
        private ?LogActivityConfigurasiRateLimitResponse $logActivityConfigurasiRateLimitResponse = null,
       
    ) {
        $this->logActivityConfigurasiRateLimitService    = $logActivityConfigurasiRateLimitService ?? app(LogActivityConfigurasiRateLimitService::class);
        $this->logActivityConfigurasiRateLimitRepository = $logActivityConfigurasiRateLimitRepository ?? app(LogActivityConfigurasiRateLimitRepository::class);
        $this->logActivityConfigurasiRateLimitResponse   = $logActivityConfigurasiRateLimitResponse ?? app(LogActivityConfigurasiRateLimitResponse::class);
    }

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
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
            $this->logActivityConfigurasiRateLimitService->logUpdated(
                $updatedConfigurasiRateLimit,
                $request->user()
            );

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

    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $logs    = $this->logActivityConfigurasiRateLimitRepository->paginate($perPage, $request->query('search'));

            $transformed = $logs->through(
                fn ($log) => (new LogActivityConfigurasiRateLimitResource($log))->resolve()
            );

            return $this->logActivityConfigurasiRateLimitResponse->list(
                $transformed,
                'Daftar log aktivitas konfigurasi rate limit berhasil diambil.'
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log konfigurasi rate limit: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->logActivityConfigurasiRateLimitResponse->serverError();
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
