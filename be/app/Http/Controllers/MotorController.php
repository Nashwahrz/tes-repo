<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportMotorRequest;
use App\Http\Requests\ImportRequest;
use App\Http\Requests\MotorRequest;
use App\Http\Responses\ImportResponse;
use App\Http\Responses\MotorResponse;
use App\Repositories\MotorRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class MotorController extends Controller
{
    public function __construct(
        private MotorRepository $motorRepository,
        private MotorResponse $motorResponse,
        private ImportResponse $importResponse,
        private PaginateController $paginateController
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $motors  = $this->motorRepository->index($perPage, $request->query('search'));
            return $this->motorResponse->list($motors);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError();
        }
    }

    /*
    public function store(MotorRequest $request)
    {
        try {
            $motor   = $this->motorRepository->createOrUpdate($request->validated());
            $message = $motor->wasRecentlyCreated
                ? 'Data motor berhasil ditambahkan.'
                : "Data motor dengan kode item {$motor->item_code} berhasil diperbarui.";

            return $this->motorResponse->success($motor, $message);
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan atau memperbarui motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError();
        }
    }
    */

    public function show(int $id)
    {
        try {
            $motor = $this->motorRepository->findById($id);

            if (!$motor) {
                return $this->motorResponse->notFound();
            }

            return $this->motorResponse->success($motor, 'Data motor berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError();
        }
    }

    /*
    public function update(MotorRequest $request, int $id)
    {
        try {
            $motor = $this->motorRepository->findById($id);

            if (!$motor) {
                return $this->motorResponse->notFound();
            }

            $updatedMotor = $this->motorRepository->update($motor, $request->validated());

            return $this->motorResponse->success($updatedMotor, 'Data motor berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->motorResponse->itemTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError();
        }
    }
    */

    /*
    public function destroy(int $id)
    {
        try {
            $motor = $this->motorRepository->findById($id);

            if (!$motor) {
                return $this->motorResponse->notFound();
            }

            $this->motorRepository->delete($motor);

            return $this->motorResponse->deleted('Data motor berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError();
        }
    }
    */

    /**
     * Import data motor dari file .UTC atau Excel (.xlsx/.xls).
     */
    public function import(ImportMotorRequest $request)
    {
        try {
            $file      = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            $filePath  = $file->getRealPath();

            if (in_array($extension, ['utc', 'txt', 'csv'])) {
                $result = $this->motorRepository->importFromUtc($filePath);
            } else {
                $result = $this->motorRepository->importFromExcel($filePath);
            }

            if ($result['success'] === 0 && !empty($result['errors'])) {
                return $this->importResponse->formatError($result['errors']);
            }

            if (isset($result['created_count']) && isset($result['updated_count'])) {
                return response()->json([
                    'success' => true,
                    'message' => "Import Motor selesai. Berhasil: {$result['success']} (Baru: {$result['created_count']}, Diperbarui: {$result['updated_count']}), Gagal: {$result['failed']}.",
                    'data'    => [
                        'success_count' => $result['success'],
                        'created_count' => $result['created_count'],
                        'updated_count' => $result['updated_count'],
                        'failed_count'  => $result['failed'],
                        'errors'        => $result['errors'],
                        'imported'      => $result['imported'],
                    ],
                ], 200);
            }

            return $this->importResponse->success($result, 'Motor');
        } catch (Throwable $e) {
            Log::error('Gagal import data motor: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->importResponse->serverError('Gagal import data motor. Silakan coba lagi.');
        }
    }

    public function export(Request $request)
    {
        try {
            $search = $request->query('search');

            $fileContent = $this->motorRepository->exportToExcel($search);
            $fileName    = 'data_motor_' . date('Ymd_His') . '.xlsx';

            return response($fileContent, 200, [
                'Content-Type'        => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
                'Cache-Control'       => 'max-age=0',
            ]);
        } catch (Throwable $e) {
            Log::error('Gagal export motor ke Excel: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->motorResponse->serverError('Gagal export data motor.');
        }
    }
}
