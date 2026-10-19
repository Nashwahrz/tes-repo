<?php

namespace App\Http\Controllers;

use App\Http\Requests\KelurahanRequest;
use App\Http\Responses\KelurahanResponse;
use App\Repositories\KelurahanRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class KelurahanController extends Controller
{
    public function __construct(
        private KelurahanRepository $kelurahanRepository,
        private KelurahanResponse $kelurahanResponse
    ) {}

    public function index()
    {
        try {
            $kelurahans = $this->kelurahanRepository->paginate();
            return $this->kelurahanResponse->list($kelurahans);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data kelurahan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kelurahanResponse->serverError();
        }
    }

    
    public function store(KelurahanRequest $request)
    {
        try {   
            $kelurahan = $this->kelurahanRepository->create($request->validated());
            return $this->kelurahanResponse->success($kelurahan, 'Kelurahan berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kelurahanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan kelurahan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kelurahanResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $kelurahan = $this->kelurahanRepository->findById($id);

            if (!$kelurahan) {
                return $this->kelurahanResponse->notFound();
            }

            return $this->kelurahanResponse->success($kelurahan, 'Data kelurahan berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail kelurahan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kelurahanResponse->serverError();
        }
    }

    public function update(KelurahanRequest $request, int $id)
    {
        try {
            $kelurahan = $this->kelurahanRepository->findById($id);

            if (!$kelurahan) {
                return $this->kelurahanResponse->notFound();
            }

            $updatedKelurahan = $this->kelurahanRepository->update($kelurahan, $request->validated());

            return $this->kelurahanResponse->success($updatedKelurahan, 'Kelurahan berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kelurahanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui kelurahan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kelurahanResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $kelurahan = $this->kelurahanRepository->findById($id);

            if (!$kelurahan) {
                return $this->kelurahanResponse->notFound();
            }

            $this->kelurahanRepository->delete($kelurahan);

            return $this->kelurahanResponse->deleted('Kelurahan berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus kelurahan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kelurahanResponse->serverError();
        }
    }
}
