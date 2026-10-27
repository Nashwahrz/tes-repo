<?php

namespace App\Http\Controllers;

use App\Http\Requests\AppKeyOcrRequest;
use App\Http\Responses\AppKeyOcrResponse;
use App\Repositories\AppKeyOcrRepository;
use Illuminate\Http\Request;
use Log;
use Throwable;

class AppKeyOcrController extends Controller
{
    public function __construct(
        private AppKeyOcrRepository $appKeyOcrRepository,
        private AppKeyOcrResponse $appKeyOcrResponse
    ) {}

    public function index()
    {
        try {
            $appKeyOcrs = $this->appKeyOcrRepository->all();
            return $this->appKeyOcrResponse->list($appKeyOcrs);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data app key ocr: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->appKeyOcrResponse->serverError();
        }
    }
    
    public function show(int $id)
    {
        try {
            $appKeyOcr = $this->appKeyOcrRepository->findById($id);

            if (!$appKeyOcr) {
                return $this->appKeyOcrResponse->notFound();
            }

            return $this->appKeyOcrResponse->success($appKeyOcr, 'Data app key ocr berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail app key ocr: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->appKeyOcrResponse->serverError();
        }
    }
    public function update(AppKeyOcrRequest $request, int $id)
    {
        try {
            $appKeyOcr = $this->appKeyOcrRepository->findById($id);

            if (!$appKeyOcr) {
                return $this->appKeyOcrResponse->notFound();
            }

            $appKeyOcr = $this->appKeyOcrRepository->update($appKeyOcr, $request->validated());
            return $this->appKeyOcrResponse->success($appKeyOcr, 'AppKeyOcr berhasil diupdate.');
        } catch (Throwable $e) {
            Log::error('Gagal mengupdate app key ocr: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->appKeyOcrResponse->serverError();
        }
    }
}
