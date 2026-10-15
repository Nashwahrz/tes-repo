<?php

namespace App\Http\Controllers;

use App\Http\Responses\LogUserResponse;
use App\Repositories\LogUserRepository;
use Illuminate\Http\Request;
use Log;
use Throwable;

class LogUserController extends Controller
{
    public function __construct(
        private LogUserRepository $logUserRepository,
        private LogUserResponse $logUserResponse
    ) {}
    public function index()
    {
        try {
            $logUser = $this->logUserRepository->paginate();

            return $this->logUserResponse->list($logUser, 'Daftar log user berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->logUserResponse->serverError();
        }
    }
}
