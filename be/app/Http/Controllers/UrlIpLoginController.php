<?php

namespace App\Http\Controllers;

use App\Http\Requests\UrlIpLoginRequest;
use App\Http\Responses\UrlIpResponse;
use App\Repositories\UrlIpLoginRepository;
use Illuminate\Http\Request;
use Log;
use Throwable;

class UrlIpLoginController extends Controller
{
    public function __construct(
        private UrlIpLoginRepository $urlIpLoginRepository,
        private UrlIpResponse $urlIpResponse
    ) {}

    public function index()
    {
        try {
            $urlIpLogins = $this->urlIpLoginRepository->all();
            return $this->urlIpResponse->list($urlIpLogins);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data url ip login: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->urlIpResponse->serverError();
        }
    }
    
    public function show(int $id)
    {
        try {
            $urlIpLogin = $this->urlIpLoginRepository->findById($id);

            if (!$urlIpLogin) {
                return $this->urlIpResponse->notFound();
            }

            return $this->urlIpResponse->success($urlIpLogin, 'Data url ip login berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail url ip login: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->urlIpResponse->serverError();
        }
    }
    public function update(UrlIpLoginRequest $request, int $id)
    {
        try {
            $urlIpLogin = $this->urlIpLoginRepository->findById($id);

            if (!$urlIpLogin) {
                return $this->urlIpResponse->notFound();
            }

            $urlIpLogin = $this->urlIpLoginRepository->update($urlIpLogin, $request->validated());
            return $this->urlIpResponse->success($urlIpLogin, 'UrlIpLogin berhasil diupdate.');
        } catch (Throwable $e) {
            Log::error('Gagal mengupdate url ip login: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->urlIpResponse->serverError();
        }
    }
}
