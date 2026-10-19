<?php

namespace App\Http\Controllers;

use App\Http\Requests\PekerjaanRequest;
use App\Http\Responses\PekerjaanResponse;
use App\Repositories\PekerjaanRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class PekerjaanController extends Controller
{
    public function __construct(
        private PekerjaanRepository $pekerjaanRepository,
        private PekerjaanResponse $pekerjaanResponse
    ) {}

    public function index()
    {
        try {
            $pekerjaans = $this->pekerjaanRepository->paginate();
            return $this->pekerjaanResponse->list($pekerjaans);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }

    
    public function store(PekerjaanRequest $request)
    {
        try {
            $pekerjaan = $this->pekerjaanRepository->create($request->validated());
            return $this->pekerjaanResponse->success($pekerjaan, 'Pekerjaan berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->pekerjaanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $pekerjaan = $this->pekerjaanRepository->findById($id);

            if (!$pekerjaan) {
                return $this->pekerjaanResponse->notFound();
            }

            return $this->pekerjaanResponse->success($pekerjaan, 'Data pekerjaan berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }

    public function update(PekerjaanRequest $request, int $id)
    {
        try {
            $pekerjaan = $this->pekerjaanRepository->findById($id);

            if (!$pekerjaan) {
                return $this->pekerjaanResponse->notFound();
            }

            $updatedPekerjaan = $this->pekerjaanRepository->update($pekerjaan, $request->validated());

            return $this->pekerjaanResponse->success($updatedPekerjaan, 'Pekerjaan berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->pekerjaanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $pekerjaan = $this->pekerjaanRepository->findById($id);

            if (!$pekerjaan) {
                return $this->pekerjaanResponse->notFound();
            }

            $this->pekerjaanRepository->delete($pekerjaan);

            return $this->pekerjaanResponse->deleted('Pekerjaan berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }
}
