<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProvinsiRequest;
use App\Http\Responses\ProvinsiResponse;
use App\Repositories\ProvinsiRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class ProvinsiController extends Controller
{
    public function __construct(
        private ProvinsiRepository $provinsiRepository,
        private ProvinsiResponse $provinsiResponse
    ) {}

    public function index()
    {
        try {
            $provinsis = $this->provinsiRepository->paginate();
            return $this->provinsiResponse->list($provinsis);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data provinsi: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->provinsiResponse->serverError();
        }
    }

    
    public function store(ProvinsiRequest $request)
    {
        try {
            $provinsi = $this->provinsiRepository->create($request->validated());
            return $this->provinsiResponse->success($provinsi, 'Provinsi berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->provinsiResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan provinsi: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->provinsiResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $provinsi = $this->provinsiRepository->findById($id);

            if (!$provinsi) {
                return $this->provinsiResponse->notFound();
            }

            return $this->provinsiResponse->success($provinsi, 'Data provinsi berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail provinsi: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->provinsiResponse->serverError();
        }
    }

    public function update(ProvinsiRequest $request, int $id)
    {
        try {
            $provinsi = $this->provinsiRepository->findById($id);

            if (!$provinsi) {
                return $this->provinsiResponse->notFound();
            }

            $updatedProvinsi = $this->provinsiRepository->update($provinsi, $request->validated());

            return $this->provinsiResponse->success($updatedProvinsi, 'Provinsi berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->provinsiResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui provinsi: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->provinsiResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $provinsi = $this->provinsiRepository->findById($id);

            if (!$provinsi) {
                return $this->provinsiResponse->notFound();
            }

            $this->provinsiRepository->delete($provinsi);

            return $this->provinsiResponse->deleted('Provinsi berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus provinsi: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->provinsiResponse->serverError();
        }
    }
}
