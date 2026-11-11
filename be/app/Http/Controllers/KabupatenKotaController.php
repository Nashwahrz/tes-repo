<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeografisStatusRequest;
use App\Http\Requests\ImportRequest;
use App\Http\Requests\KabupatenKotaRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Responses\ImportResponse;
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
        private KabupatenKotaResponse $kabupatenKotaResponse,
        private ImportResponse $importResponse,
        private PaginateController $paginateController
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $kabupatenKotas = $this->kabupatenKotaRepository->paginate($perPage, $request->query('search'));
            return $this->kabupatenKotaResponse->list($kabupatenKotas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }
    public function indexAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $kabupatenKotas = $this->kabupatenKotaRepository->paginateAktif($perPage, $request->query('search'));
            return $this->kabupatenKotaResponse->list($kabupatenKotas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data kabupaten kota: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError();
        }
    }
    public function indexNonAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $kabupatenKotas = $this->kabupatenKotaRepository->paginateNonAktif($perPage, $request->query('search'));
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

            $updatedKabupatenKota = $this->kabupatenKotaRepository->update($kabupatenKota, $request->only('kabupaten_kota_name', 'fk_provinsi'));

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
    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);

            return ActivityLogResource::collection(
                $this->kabupatenKotaRepository->getAllLogs($perPage, $request->query('search'))
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log kabupaten kota: ' . $e->getMessage());
            return $this->kabupatenKotaResponse->serverError();
        }
    }
    public function import(ImportRequest $request)
    {
        try {
            $filePath = $request->file('file')->getRealPath();
            $result   = $this->kabupatenKotaRepository->importFromExcel($filePath);

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            return $this->importResponse->success($result, 'Kabupaten Kota');
        } catch (Throwable $e) {
            Log::error('Gagal import Kabupaten Kota dari Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import data Kabupaten Kota. Silakan coba lagi.');
        }
    }
    public function export(Request $request)
    {
        try {
            $search = $request->query('search');
            $status = $request->has('status') ? filter_var($request->query('status'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;

            $fileContent = $this->kabupatenKotaRepository->exportToExcel($search, $status);
            $fileName    = 'data_kabupaten_kota_' . date('Ymd_His') . '.xlsx';

            return response($fileContent, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                'Cache-Control'       => 'max-age=0',
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal export kabupaten kota ke Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->kabupatenKotaResponse->serverError('Gagal export data kabupaten kota.');
        }
    }
}
