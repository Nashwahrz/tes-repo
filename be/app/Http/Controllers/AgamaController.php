<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgamaRequest;
use App\Http\Requests\GeografisStatusRequest;
use App\Http\Requests\ImportRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Responses\AgamaResponse;
use App\Http\Responses\ImportResponse;
use App\Repositories\AgamaRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class AgamaController extends Controller
{
    public function __construct(
        private AgamaRepository $agamaRepository,
        private AgamaResponse $agamaResponse,
        private ImportResponse $importResponse,
        private PaginateController $paginateController
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $agamas = $this->agamaRepository->paginate($perPage, $request->query('search'));
            return $this->agamaResponse->list($agamas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }
    public function indexAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $agamas = $this->agamaRepository->paginateAktif($perPage, $request->query('search'));
            return $this->agamaResponse->list($agamas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }
    public function indexNonAktif(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $agamas = $this->agamaRepository->paginateNonAktif($perPage, $request->query('search'));
            return $this->agamaResponse->list($agamas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    
    public function store(AgamaRequest $request)
    {
        try {
            $agama = $this->agamaRepository->create($request->validated());
            return $this->agamaResponse->success($agama, 'Agama berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->agamaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            return $this->agamaResponse->success($agama, 'Data agama berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function update(AgamaRequest $request, int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            $updatedAgama = $this->agamaRepository->update($agama, $request->only('name'));

            return $this->agamaResponse->success($updatedAgama, 'Agama berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->agamaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }
    public function status(GeografisStatusRequest $request, int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            $updatedAgama = $this->agamaRepository->update($agama, $request->validated());

            return $this->agamaResponse->success($updatedAgama, 'Status agama berhasil diubah.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->agamaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal mengaktifkan agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            $this->agamaRepository->delete($agama);

            return $this->agamaResponse->deleted('Agama berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }
    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);

            return ActivityLogResource::collection(
                $this->agamaRepository->getAllLogs($perPage, $request->query('search'))
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log agama: ' . $e->getMessage());
            return $this->agamaResponse->serverError();
        }
    }

    public function import(ImportRequest $request)
    {
        try {
            $filePath = $request->file('file')->getRealPath();
            $result   = $this->agamaRepository->importFromExcel($filePath);

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            return $this->importResponse->success($result, 'Agama');
        } catch (Throwable $e) {
            Log::error('Gagal import agama dari Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import data agama. Silakan coba lagi.');
        }
    }
  
    public function export(Request $request)
    {
        try {
            $search = $request->query('search');
            $status = $request->has('status') ? filter_var($request->query('status'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) : null;

            $fileContent = $this->agamaRepository->exportToExcel($search, $status);
            $fileName    = 'data_agama_' . date('Ymd_His') . '.xlsx';

            return response($fileContent, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                'Cache-Control'       => 'max-age=0',
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal export agama ke Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError('Gagal export data agama.');
        }
    }
}
