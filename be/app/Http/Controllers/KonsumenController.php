<?php

namespace App\Http\Controllers;

use App\Enums\StatusKonsumen;
use App\Http\Requests\KonsumenRequest;
use App\Http\Responses\KonsumenResponse;
use App\Repositories\KonsumenRepository;
use App\Services\KtpOcrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class KonsumenController extends Controller
{
    public function __construct(
        private KonsumenRepository $konsumenRepository,
        private KonsumenResponse $konsumenResponse,
        private KtpOcrService $ktpOcrService
    ) {}

    public function index()
    {
        try {
            $konsumens = $this->konsumenRepository->all();
            return $this->konsumenResponse->list($konsumens);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError();
        }
    }

    public function status(Request $request)
    {
        try {
            $status = $request->query('status')
                ? StatusKonsumen::tryFrom($request->query('status'))
                : null;

            $konsumens = $this->konsumenRepository->getStatus($status);

            return $this->konsumenResponse->list($konsumens, 'Daftar konsumen berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil status konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError();
        }
    }

   
    public function scanKtp(Request $request)
    {
        $request->validate([
            'foto_ktp' => ['required', 'image', 'mimes:jpg,jpeg,png', 'max:2048'],
        ]);

        try {
            $extractedData = $this->ktpOcrService->extractKtp($request->file('foto_ktp'));

            return $this->konsumenResponse->scanSuccess($extractedData, 'KTP berhasil dipindai.');
        } catch (Throwable $e) {
            Log::error('OCR Scan failed: ' . $e->getMessage());
            return $this->konsumenResponse->serverError('Gagal memproses OCR KTP: ' . $e->getMessage());
        }
    }

    public function store(KonsumenRequest $request)
    {
        try {
            $data = $request->validated();

            if ($request->hasFile('foto_ktp')) {
                $file = $request->file('foto_ktp');
                $filename = 'ktp_' . date('Ymd_His') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('ktp', $filename, 'public');
                $data['foto_ktp'] = $path;
            }

            $konsumen = $this->konsumenRepository->create($data);

            return $this->konsumenResponse->success($konsumen, 'Data konsumen berhasil disimpan.');
        } catch (Throwable $e) {
            Log::error('Gagal menyimpan konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $konsumen = $this->konsumenRepository->findById($id);

            if (!$konsumen) {
                return $this->konsumenResponse->notFound();
            }

            return $this->konsumenResponse->success($konsumen, 'Detail konsumen berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail konsumen: ' . $e->getMessage());
            return $this->konsumenResponse->serverError();
        }
    }

    public function update(KonsumenRequest $request, int $id)
    {
        try {
            $konsumen = $this->konsumenRepository->findById($id);

            if (!$konsumen) {
                return $this->konsumenResponse->notFound();
            }

            $data = $request->validated();

            if ($request->hasFile('foto_ktp')) {
                $file = $request->file('foto_ktp');
                $filename = 'ktp_' . date('Ymd_His') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('ktp', $filename, 'public');
                $data['foto_ktp'] = $path;
            }

            $updated = $this->konsumenRepository->update($konsumen, $data);

            return $this->konsumenResponse->success($updated, 'Data konsumen berhasil diperbarui.');
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui konsumen: ' . $e->getMessage());
            return $this->konsumenResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $konsumen = $this->konsumenRepository->findById($id);

            if (!$konsumen) {
                return $this->konsumenResponse->notFound();
            }

            $this->konsumenRepository->delete($konsumen);

            return $this->konsumenResponse->deleted();
        } catch (Throwable $e) {
            Log::error('Gagal menghapus konsumen: ' . $e->getMessage());
            return $this->konsumenResponse->serverError();
        }
    }
}

