<?php

namespace App\Http\Controllers;

use App\Http\Responses\LogBlockedUserResponse;
use App\Repositories\LogBlockedUserRepository;
use App\Services\LoginLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class LogBlockedUserController extends Controller
{
    public function __construct(
        private LogBlockedUserRepository $logBlockedUserRepository,
        private LogBlockedUserResponse $response,
        private LoginLogService $loginLogService
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
            $search  = $request->query('search');
            $type    = $request->query('type');
            $status  = $request->query('status'); // aktif, dibuka, kedaluwarsa

            $logs = $this->logBlockedUserRepository->paginate($perPage, $search, $type, $status);

            return $this->response->list($logs);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar log akun terblokir: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->response->serverError();
        }
    }

    // public function active(Request $request)
    // {
    //     try {
    //         $search = $request->query('search');
    //         $logs   = $this->logBlockedUserRepository->getActiveBlocks($search);

    //         return $this->response->list($logs, 'Daftar akun yang sedang aktif diblokir berhasil diambil.');
    //     } catch (Throwable $e) {
    //         Log::error('Gagal mengambil daftar akun aktif terblokir: ' . $e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);

    //         return $this->response->serverError();
    //     }
    // }

    // public function unblock(Request $request)
    // {
    //     try {
    //         $email = $request->input('email');
    //         $ip    = $request->input('ip') ?: $request->input('ip_address');

    //         if (! $email && ! $ip) {
    //             return $this->response->validationError([
    //                 'target' => ['Harap masukkan email atau IP address yang ingin dibuka blokirnya.'],
    //             ]);
    //         }

    //         $this->clearCacheForTarget($email, $ip);

    //         $adminId = Auth::id();
    //         $updatedCount = $this->logBlockedUserRepository->unblockByTarget($email, $ip, $adminId);

    //         return $this->response->success([
    //             'email'         => $email,
    //             'ip_address'    => $ip,
    //             'records_freed' => $updatedCount,
    //         ], 'Blokir akun / IP berhasil dibuka.');
    //     } catch (Throwable $e) {
    //         Log::error('Gagal membuka blokir akun: ' . $e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);

    //         return $this->response->serverError();
    //     }
    // }

    public function unblockById(Request $request, int $id)
    {
        try {
            $log = $this->logBlockedUserRepository->findById($id);

            if (! $log) {
                return $this->response->notFound();
            }

            $this->clearCacheForTarget($log->email, $log->ip_address);

            $adminId = Auth::id();
            $updatedLog = $this->logBlockedUserRepository->unblock($log, $adminId);

            return $this->response->success($updatedLog, 'Blokir akun berhasil dibuka.');
        } catch (Throwable $e) {
            Log::error('Gagal membuka blokir akun berdasarkan ID: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->response->serverError();
        }
    }

    private function clearCacheForTarget(?string $email, ?string $ip): void
    {
        $normalizedEmail = $email ? strtolower(trim($email)) : null;

        if ($ip && $normalizedEmail) {
            $this->loginLogService->clearAttempts($ip, $normalizedEmail);
        }

        $limiters = ['otp-send', 'otp-verify', 'login', 'scan-ktp'];

        foreach ($limiters as $limiterName) {
            if ($ip) {
                RateLimiter::clear(md5($limiterName . 'ip:' . $ip));
            }
            if ($normalizedEmail) {
                RateLimiter::clear(md5($limiterName . 'email:' . $normalizedEmail));
            }
        }
    }
}
