<?php

namespace App\Http\Controllers;

use App\Http\Requests\KabupatenKotaRequest;
use App\Http\Responses\KabupatenKotaResponse;
use App\Repositories\KabupatenKotaRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class KabupatenKotaController extends Controller
{
    public function __construct(
        private KabupatenKotaRepository $kabupatenKotaRepository,
        private KabupatenKotaResponse $kabupatenKotaResponse
    ) {}

    public function index()
    {
        try {
            $kabupatenKotas = $this->kabupatenKotaRepository->paginate();
            return $this->kabupatenKotaResponse->list($kabupatenKotas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }

    
    public function store(KabupatenKotaRequest $request)
    {
        try {   
            $kabupatenKota = $this->kabupatenKotaRepository->create($request->validated());
            return $this->kabupatenKotaResponse->success($kabupatenKota, 'Kabupaten kota berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kabupatenKotaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $kabupatenKota = $this->kabupatenKotaRepository->findById($id);

            if (!$kabupatenKota) {
                return $this->kabupatenKotaResponse->notFound();
            }

            return $this->kabupatenKotaResponse->success($kabupatenKota, 'Data kabupaten kota berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }

    public function update(KabupatenKotaRequest $request, int $id)
    {
        try {
            $kabupatenKota = $this->kabupatenKotaRepository->findById($id);

            if (!$kabupatenKota) {
                return $this->kabupatenKotaResponse->notFound();
            }

            $updatedKabupatenKota = $this->kabupatenKotaRepository->update($kabupatenKota, $request->validated());

            return $this->kabupatenKotaResponse->success($updatedKabupatenKota, 'Kabupaten kota berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kabupatenKotaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $kabupatenKota = $this->kabupatenKotaRepository->findById($id);

            if (!$kabupatenKota) {
                return $this->kabupatenKotaResponse->notFound();
            }

            $this->kabupatenKotaRepository->delete($kabupatenKota);

            return $this->kabupatenKotaResponse->deleted('Kabupaten kota berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }
}
