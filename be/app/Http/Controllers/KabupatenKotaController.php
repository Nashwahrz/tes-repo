<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeografisStatusRequest;
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

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
            $kabupatenKotas = $this->kabupatenKotaRepository->paginate($perPage, $request->query('search'));
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

            $updatedKabupatenKota = $this->kabupatenKotaRepository->update($kabupatenKota, $request->only('name', 'kode_provinsi'));

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
    public function status(GeografisStatusRequest $request, int $id)
    {
        try {
            $kabupatenkota = $this->kabupatenKotaRepository->findById($id);

            if (!$kabupatenkota) {
                return $this->kabupatenKotaResponse->notFound();
            }

            $updatedKabupatenkota = $this->kabupatenKotaRepository->update($kabupatenkota, $request->validated());

            return $this->kabupatenKotaResponse->success($updatedKabupatenkota, 'Status kabupaten kota berhasil diubah.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->kabupatenKotaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal mengaktifkan kabupaten kota: ' . $e->getMessage(), [
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
