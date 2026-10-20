<?php

namespace App\Http\Controllers;


use App\Http\Requests\KecamatanRequest;
use App\Http\Responses\KecamatanResponse;
use App\Repositories\KecamatanRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class KecamatanController extends Controller
{
    public function __construct(
        private KecamatanRepository $kecamatanRepository,
        private KecamatanResponse $kecamatanResponse
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
            $kecamatans = $this->kecamatanRepository->paginate($perPage, $request->query('search'));
            return $this->kecamatanResponse->list($kecamatans);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data kecamatan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kecamatanResponse->serverError();
        }
    }

    
    public function store(KecamatanRequest $request)
    {
        try {   
            $kecamatan = $this->kecamatanRepository->create($request->validated());
            return $this->kecamatanResponse->success($kecamatan, 'Kecamatan berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kecamatanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan kecamatan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kecamatanResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $kecamatan = $this->kecamatanRepository->findById($id);

            if (!$kecamatan) {
                return $this->kecamatanResponse->notFound();
            }

            return $this->kecamatanResponse->success($kecamatan, 'Data kecamatan berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail kecamatan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kecamatanResponse->serverError();
        }
    }

    public function update(KecamatanRequest $request, int $id)
    {
        try {
            $kecamatan = $this->kecamatanRepository->findById($id);

            if (!$kecamatan) {
                return $this->kecamatanResponse->notFound();
            }

            $updatedKecamatan = $this->kecamatanRepository->update($kecamatan, $request->validated());

            return $this->kecamatanResponse->success($updatedKecamatan, 'Kecamatan berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kecamatanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui kecamatan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kecamatanResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $kecamatan = $this->kecamatanRepository->findById($id);

            if (!$kecamatan) {
                return $this->kecamatanResponse->notFound();
            }

            $this->kecamatanRepository->delete($kecamatan);

            return $this->kecamatanResponse->deleted('Kecamatan berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus kecamatan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kecamatanResponse->serverError();
        }
    }
}
