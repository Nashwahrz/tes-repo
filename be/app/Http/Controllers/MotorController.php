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
            $request->integer('page', 1);
            $request->integer('per_page', PaginateController::DEFAULT_PER_PAGE);
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

            // Sementara hanya menerima impor dari berkas format .utc
            $result = $this->motorRepository->importFromUtc($filePath);

            /*
            if (in_array($extension, ['utc', 'txt', 'csv'])) {
                $result = $this->motorRepository->importFromUtc($filePath);
            } else {
                $result = $this->motorRepository->importFromExcel($filePath);
            }
            */

            $unchanged = $result['unchanged_count'] ?? 0;

            if ($result['success'] === 0 && $unchanged === 0 && !empty($result['errors'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal: format atau panjang karakter data pada berkas tidak sesuai.',
                    'errors'  => $result['errors'],
                ], 422);
            }

            if (isset($result['created_count']) && isset($result['updated_count'])) {
                $created = $result['created_count'];
                $updated = $result['updated_count'];
                $failed  = $result['failed'];

                if ($created === 0 && $updated === 0) {
                    $statusMsg = $failed > 0
                        ? "Tidak ada perubahan data motor ({$failed} baris data gagal validasi)."
                        : "Tidak ada perubahan data motor (semua data pada berkas sudah sesuai dan mutakhir).";
                } elseif ($created === 0 && $updated === 1 && !empty($result['imported'][0]['kolom_diubah'])) {
                    $itemCode = $result['imported'][0]['item_code'];
                    $colsStr  = implode(', ', $result['imported'][0]['kolom_diubah']);
                    $statusMsg = $failed > 0
                        ? "Import Motor selesai. Data {$itemCode} berhasil diperbarui pada kolom [{$colsStr}] (terdapat {$failed} baris data lain gagal validasi)."
                        : "Import Motor selesai. Data {$itemCode} berhasil diperbarui pada kolom [{$colsStr}].";
                } else {
                    $details = [];
                    if ($created > 0) {
                        $details[] = "Baru: {$created}";
                    }
                    if ($updated > 0) {
                        $details[] = "Diperbarui: {$updated}";
                    }
                    if ($unchanged > 0) {
                        $details[] = "Tidak Berubah: {$unchanged}";
                    }
                    $detailsStr = implode(', ', $details);

                    $statusMsg = $failed > 0
                        ? "Import Motor selesai dengan beberapa data gagal validasi. Berhasil: {$result['success']} ({$detailsStr}), Gagal: {$failed}."
                        : "Import Motor selesai. Berhasil: {$result['success']} ({$detailsStr}), Gagal: {$failed}.";
                }

                return response()->json([
                    'success' => true,
                    'message' => $statusMsg,
                    'data'    => [
                        'success_count'   => $result['success'],
                        'created_count'   => $created,
                        'updated_count'   => $updated,
                        'unchanged_count' => $unchanged,
                        'failed_count'    => $failed,
                        'errors'          => $result['errors'],
                        'imported'        => $result['imported'],
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
