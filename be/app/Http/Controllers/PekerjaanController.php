<?php

namespace App\Http\Controllers;

use App\Http\Requests\GeografisStatusRequest;
use App\Http\Requests\ImportRequest;
use App\Http\Requests\PekerjaanRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Responses\ImportResponse;
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
        private PekerjaanResponse $pekerjaanResponse,
        private ImportResponse $importResponse,
        private PaginateController $paginateController
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $pekerjaans = $this->pekerjaanRepository->paginate($perPage, $request->query('search'));
            return $this->pekerjaanResponse->list($pekerjaans);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }
    public function indexAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $pekerjaans = $this->pekerjaanRepository->paginateAktif($perPage, $request->query('search'));
            return $this->pekerjaanResponse->list($pekerjaans);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data pekerjaan: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError();
        }
    }
    public function indexNonAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $pekerjaans = $this->pekerjaanRepository->paginateNonAktif($perPage, $request->query('search'));
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
    public function status(GeografisStatusRequest $request, int $id)
    {
        try {
            $pekerjaan = $this->pekerjaanRepository->findById($id);

            if (!$pekerjaan) {
                return $this->pekerjaanResponse->notFound();
            }

            $updatedPekerjaan = $this->pekerjaanRepository->update($pekerjaan, $request->validated());

            return $this->pekerjaanResponse->success($updatedPekerjaan, 'Status pekerjaan berhasil diubah.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->pekerjaanResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal mengaktifkan pekerjaan: ' . $e->getMessage(), [
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

            $updatedPekerjaan = $this->pekerjaanRepository->update($pekerjaan, $request->only('name'));

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
    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);

            return ActivityLogResource::collection(
                $this->pekerjaanRepository->getAllLogs($perPage, $request->query('search'))
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log pekerjaan: ' . $e->getMessage());
            return $this->pekerjaanResponse->serverError();
        }
    }
    public function import(ImportRequest $request)
    {
        try {
            $filePath = $request->file('file')->getRealPath();
            $result   = $this->pekerjaanRepository->importFromExcel($filePath);

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            return $this->importResponse->success($result, 'Pekerjaan');
        } catch (Throwable $e) {
            Log::error('Gagal import pekerjaan dari Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import data pekerjaan. Silakan coba lagi.');
        }
    }
    public function export(Request $request)
    {
        try {
            $search = $request->query('search');
            $status = $request->has('status') ? filter_var($request->query('status'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;

            $fileContent = $this->pekerjaanRepository->exportToExcel($search, $status);
            $fileName    = 'data_pekerjaan_' . date('Ymd_His') . '.xlsx';

            return response($fileContent, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                'Cache-Control'       => 'max-age=0',
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal export pekerjaan ke Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->pekerjaanResponse->serverError('Gagal export data pekerjaan.');
        }
    }
}
