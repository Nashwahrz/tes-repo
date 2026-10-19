<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailWhiteListRequest;
use App\Http\Responses\EmailWhiteListResponse;
use App\Repositories\EmailWhitelistRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;



class EmailWhiteListController extends Controller
{
    public function __construct(
        private EmailWhitelistRepository $emailWhiteListRepository,
        private EmailWhiteListResponse $emailWhiteListResponse
    ) {}

    public function index()
    {
        try {
            $emails = $this->emailWhiteListRepository->all();
            return $this->emailWhiteListResponse->list($emails);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data email whitelist: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailWhiteListResponse->serverError();
        }
    }
    public function store(EmailWhiteListRequest $request)
    {
        try {
            $email = $this->emailWhiteListRepository->create($request->validated());
            return $this->emailWhiteListResponse->success($email, 'Domain email berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->emailWhiteListResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan domain email: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailWhiteListResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $email = $this->emailWhiteListRepository->findById($id);

            if (!$email) {
                return $this->emailWhiteListResponse->notFound();
            }

            return $this->emailWhiteListResponse->success($email, 'Data domain email whitelist berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail email whitelist: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailWhiteListResponse->serverError();
        }
    }

    public function update(EmailWhiteListRequest $request, int $id)
    {
        try {
            $email = $this->emailWhiteListRepository->findById($id);

            if (!$email) {
                return $this->emailWhiteListResponse->notFound();
            }

            $updatedEmail = $this->emailWhiteListRepository->update($email, $request->validated());

            return $this->emailWhiteListResponse->success($updatedEmail, 'Domain email whitelist berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->emailWhiteListResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui domain email whitelist: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailWhiteListResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $email = $this->emailWhiteListRepository->findById($id);

            if (!$email) {
                return $this->emailWhiteListResponse->notFound();
            }

            $this->emailWhiteListRepository->delete($email);

            return $this->emailWhiteListResponse->deleted('Domain email whitelist berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus domain email whitelist: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailWhiteListResponse->serverError();
        }
    }


}
