<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmailSmtpRequest;
use App\Http\Responses\EmailSmtpResponse;
use App\Repositories\EmailSmtpRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class EmailSmtpController extends Controller
{
    public function __construct(
        private EmailSmtpRepository $emailSmtpRepository,
        private EmailSmtpResponse $emailSmtpResponse
    ) {}

    public function index()
    {
        try {
            $emailSmtps = $this->emailSmtpRepository->all();
            return $this->emailSmtpResponse->list($emailSmtps);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data email smtp: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailSmtpResponse->serverError();
        }
    }
    public function store(EmailSmtpRequest $request)
    {
        try {   
            $emailSmtp = $this->emailSmtpRepository->create($request->validated());
            return $this->emailSmtpResponse->success($emailSmtp, 'Email SMTP berhasil ditambahkan.');
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan email smtp: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailSmtpResponse->serverError();
        }
    }
    public function show(int $id)
    {
        try {
            $emailSmtp = $this->emailSmtpRepository->findById($id);

            if (!$emailSmtp) {
                return $this->emailSmtpResponse->notFound();
            }

            return $this->emailSmtpResponse->success($emailSmtp, 'Data email smtp berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail email smtp: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailSmtpResponse->serverError();
        }
    }
    public function update(EmailSmtpRequest $request, int $id)
    {
        try {
            $emailSmtp = $this->emailSmtpRepository->findById($id);

            if (!$emailSmtp) {
                return $this->emailSmtpResponse->notFound();
            }

            $emailSmtp = $this->emailSmtpRepository->update($emailSmtp, $request->validated());
            return $this->emailSmtpResponse->success($emailSmtp, 'Email SMTP berhasil diupdate.');
        } catch (Throwable $e) {
            Log::error('Gagal mengupdate email smtp: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailSmtpResponse->serverError();
        }
    }
    public function destroy(int $id)
    {
        try {
            $emailSmtp = $this->emailSmtpRepository->findById($id);

            if (!$emailSmtp) {
                return $this->emailSmtpResponse->notFound();
            }

            $this->emailSmtpRepository->delete($emailSmtp);
            return $this->emailSmtpResponse->success($emailSmtp, 'Email SMTP berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus email smtp: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->emailSmtpResponse->serverError();
        }
    }
}
