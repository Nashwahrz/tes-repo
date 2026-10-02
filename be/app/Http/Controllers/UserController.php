<?php

namespace App\Http\Controllers;

use App\Enums\StatusUser;
use App\Http\Requests\ActivateUserRequest;
use App\Http\Responses\UserResponse;
use App\Models\Role;
use App\Repositories\UserRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class UserController extends Controller
{
    public function __construct(
        private UserRepository $userRepository,
        private UserResponse $userResponse
    ) {}


    
    public function activate(ActivateUserRequest $request, string|int $id)
    {
        try {

            $user = $this->userRepository->findById($id);

            if (!$user) {
                return $this->userResponse->notFound('User tidak ditemukan.');
            }

            $status = $request->filled('status')
                ? StatusUser::tryFrom($request->status) ?? StatusUser::Aktif
                : StatusUser::Aktif;

            $updatedUser = $this->userRepository->activateUser(
                $user,
                (int) $request->id_dealer,
                $status
            );

            return $this->userResponse->success(
                $updatedUser,
                'Akun user berhasil diaktifkan dan ID dealer berhasil ditambahkan.'
            );
        } catch (Throwable $e) {
            Log::error('Aktivasi user gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }

  
    public function pendingUsers(Request $request)
    {
        try {
            $pendingUsers = $this->userRepository->getUsers(StatusUser::Pending);

            return $this->userResponse->list($pendingUsers, 'Daftar user menunggu persetujuan berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil user pending: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }

    public function aktifUsers(Request $request)
    {
        try {
            $aktifUsers = $this->userRepository->getUsers(StatusUser::Aktif);

            return $this->userResponse->list($aktifUsers, 'Daftar user aktif berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil user aktif: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }
    public function ditolakUsers(Request $request)
    {
        try {
            $ditolakUsers = $this->userRepository->getUsers(StatusUser::Ditolak);

            return $this->userResponse->list($ditolakUsers, 'Daftar user ditolak berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil user ditolak: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }

    public function nonaktifUsers(Request $request)
    {
        try {
            $nonaktifUsers = $this->userRepository->getUsers(StatusUser::Nonaktif);

            return $this->userResponse->list($nonaktifUsers, 'Daftar user non aktif berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil user non aktif: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }

    
    public function index(Request $request)
    {
        try {
            $status = $request->query('status')
                ? StatusUser::tryFrom($request->query('status'))
                : null;

            $users = $this->userRepository->getUsers($status);

            return $this->userResponse->list($users, 'Daftar user berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil daftar user: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->userResponse->serverError();
        }
    }
}
