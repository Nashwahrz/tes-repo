<?php

namespace App\Http\Controllers;

use App\Enums\StatusKonsumen;
use App\Enums\StoragePath;
use App\Enums\TypeTempKonsumen;
use App\Http\Requests\ActiveKonsumenRequest;
use App\Http\Requests\CheckNikRequest;
use App\Http\Requests\KonsumenRequest;
use App\Http\Requests\ScanKtpRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Responses\KonsumenMeResponse;
use App\Http\Responses\KonsumenResponse;
use App\Http\Responses\TempKonsumenResponse;
use App\Models\Konsumen;
use App\Models\TempKonsumen;
use App\Repositories\KonsumenMeRepository;
use App\Repositories\KonsumenRepository;
use App\Repositories\TempKonsumenRepository;
use App\Services\KtpOcrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;

class KonsumenController extends Controller
{
    public function __construct(
        private KonsumenRepository $konsumenRepository,
        private TempKonsumenRepository $tempKonsumenRepository,
        private KonsumenMeRepository $konsumenMeRepository,
        private KonsumenResponse $konsumenResponse,
        private TempKonsumenResponse $tempKonsumenResponse,
        private KonsumenMeResponse $konsumenMeResponse,
        private KtpOcrService $ktpOcrService,
        private PaginateController $paginateController
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $konsumens = $this->konsumenRepository->paginate(
                $perPage,
                $request->query('search'),
                $request->user()?->id ?? auth()->id()
            );
            return $this->konsumenResponse->paginated($konsumens);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError();
        }
    }

    public function indexAll(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);
            $konsumens = $this->konsumenRepository->paginateAll(
                $perPage,
                $request->query('search')
            );
            return $this->konsumenResponse->paginated($konsumens);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError();
        }
    }

    public function indexDealerAll(Request $request)
    {
        try {
            $user = $request->user();
            $perPage = $this->paginateController->getPerPage($request);

            if (!$user->fk_dealer) {
                return $this->konsumenResponse->paginated(
                    Konsumen::empty()->paginate($perPage)
                );
            }
            $konsumens = $this->konsumenRepository->paginateDealerAll(
                perPage: $perPage,
                search: $request->query('search'),
                userId: null,
                dealerId: $user->fk_dealer
            );

            return $this->konsumenResponse->paginated($konsumens);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data konsumen: ' . $e->getMessage());
            return $this->konsumenResponse->serverError();
        }
    }

    public function status(Request $request)
    {
        try {
            $status = $request->query('status')
                ? StatusKonsumen::tryFrom($request->query('status'))
                : null;

            $perPage = $this->paginateController->getPerPage($request);

            $konsumens = $this->tempKonsumenRepository->getStatus(
                status: $status,
                perPage: $perPage,
                search: $request->query('search')
            );

            return $this->tempKonsumenResponse->list($konsumens, 'Daftar konsumen berhasil diambil.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil status konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function scanKtp(ScanKtpRequest $request)
    {
        try {
            $extractedData = $this->ktpOcrService->extractKtp($request->file('foto_ktp'));

            if (!empty($extractedData['nik'])) {
                $existingKonsumen = $this->konsumenRepository->findByNik($extractedData['nik']);

                if ($existingKonsumen) {
                    return $this->konsumenResponse->scanExisting(
                        $existingKonsumen,
                        $extractedData,
                        "Konsumen dengan NIK {$extractedData['nik']} sudah terdaftar atas nama {$existingKonsumen->konsumen_name}."
                    );
                }

                $existingTemp = $this->tempKonsumenRepository->findByNik($extractedData['nik']);
                if ($existingTemp) {
                    return $this->tempKonsumenResponse->scanExisting(
                        $existingTemp,
                        $extractedData,
                        "Pengajuan konsumen dengan NIK {$extractedData['nik']} sudah ada dengan status: {$existingTemp->status->label()}."
                    );
                }
            }

            return $this->konsumenResponse->scanSuccess($extractedData, 'KTP berhasil dipindai.');
        } catch (Throwable $e) {
            Log::error('OCR Scan failed: ' . $e->getMessage());
            return $this->konsumenResponse->serverError('Gagal memproses OCR KTP: ' . $e->getMessage());
        }
    }

    public function checkNik(CheckNikRequest $request)
    {
        try {
            $keyword = $request->validated('nik');
            $konsumens = $this->konsumenRepository->searchByNik($keyword);

            // if ($konsumens->isEmpty()) {
            //     $tempKonsumens = $this->tempKonsumenRepository->searchByNik($keyword);
            //     if ($tempKonsumens->isNotEmpty()) {
            //         return $this->tempKonsumenResponse->searchResult($tempKonsumens, $keyword);
            //     }
            // }

            return $this->konsumenResponse->searchResult($konsumens, $keyword);
        } catch (Throwable $e) {
            Log::error('Gagal mencari data konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->konsumenResponse->serverError('Gagal mencari data konsumen. Silakan coba lagi.');
        }
    }

    public function store(KonsumenRequest $request)
    {
        try {
            $data = $request->validated();
            $hasNewPhoto = $request->hasFile('foto_ktp');

            if ($hasNewPhoto) {
                $file     = $request->file('foto_ktp');
                $filename = 'ktp_' . date('Ymd_His') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path     = $file->storeAs(
                    StoragePath::Ktp->value,
                    $filename,
                    StoragePath::Ktp->disk()->value
                );
                $data['foto_ktp'] = $path;
            } elseif (empty($data['foto_ktp'])) {
                unset($data['foto_ktp']);
            }

            $userId = auth()->id();

            [$konsumen, $isExisting, $isDataChanged] = $this->tempKonsumenRepository->storeWithMe($data, $userId, $hasNewPhoto);

            $message = $isExisting
                ? ($isDataChanged
                    ? 'Data konsumen ditemukan dengan perubahan, diajukan untuk verifikasi.'
                    : 'Data konsumen ditemukan (sesuai data terdaftar) dan langsung ditambahkan ke daftar konsumen Anda.')
                : 'Data pengajuan konsumen berhasil disimpan dan menunggu verifikasi.';

            return $this->tempKonsumenResponse->success($konsumen, $message);
        } catch (Throwable $e) {
            Log::error('Gagal menyimpan konsumen: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $konsumen = $this->tempKonsumenRepository->findById($id)
                ?? $this->konsumenRepository->findById($id);

            if (!$konsumen) {
                return $this->tempKonsumenResponse->notFound();
            }

            return $this->tempKonsumenResponse->success($konsumen, 'Detail konsumen berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail konsumen: ' . $e->getMessage());
            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function update(KonsumenRequest $request, int $id)
    {
        try {
            $data = $request->validated();

            if ($request->hasFile('foto_ktp')) {
                $file = $request->file('foto_ktp');
                $filename = 'ktp_' . date('Ymd_His') . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs(
                    StoragePath::Ktp->value,
                    $filename,
                    StoragePath::Ktp->disk()->value
                );
                $data['foto_ktp'] = $path;
            } elseif (empty($data['foto_ktp'])) {
                unset($data['foto_ktp']);
            }

            $userId = auth()->id();

            $tempKonsumen = $this->tempKonsumenRepository->findById($id);

            if ($tempKonsumen) {
                if ($tempKonsumen->status === StatusKonsumen::Diterima) {
                    if (empty($data['foto_ktp']) && $tempKonsumen->foto_ktp) {
                        $data['foto_ktp'] = $tempKonsumen->foto_ktp;
                    }
                    $data['fk_me']             = $userId;
                    $data['fk_konsumen']       = $tempKonsumen->id_konsumen;
                    $data['type']              = TypeTempKonsumen::Edit;
                    $data['status']            = StatusKonsumen::Pending;
                    $data['note']           = null;
                    $data['verified_by'] = null;
                    $data['verified_at']   = null;
                    $updated = $this->tempKonsumenRepository->create($data);
                } else {
                    $data['type']              = TypeTempKonsumen::Revisi;
                    $data['status']            = StatusKonsumen::Pending;
                    $data['note']           = null;
                    $data['verified_by'] = null;
                    $data['verified_at']   = null;
                    $updated = $this->tempKonsumenRepository->update($tempKonsumen, $data);
                }

                return $this->tempKonsumenResponse->success($updated, 'Data konsumen berhasil diperbarui dan diajukan kembali.');
            }

            $konsumen = $this->konsumenRepository->findById($id);
            if ($konsumen) {
                if (empty($data['foto_ktp']) && $konsumen->foto_ktp) {
                    $data['foto_ktp'] = $konsumen->foto_ktp;
                }
                $tempData = array_merge($data, [
                    'fk_me'             => $userId,
                    'fk_konsumen'       => $konsumen->id,
                    'type'              => TypeTempKonsumen::Edit,
                    'status'            => StatusKonsumen::Pending,
                    'note'           => null,
                    'old_data'   => $konsumen->toArray(),
                    'verified_by' => null,
                    'verified_at'   => null,
                ]);

                $updated = $this->tempKonsumenRepository->create($tempData);
                return $this->tempKonsumenResponse->success($updated, 'Perubahan data konsumen berhasil diajukan dan menunggu verifikasi.');
            }

            return $this->tempKonsumenResponse->notFound();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui konsumen: ' . $e->getMessage());
            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $tempKonsumen = $this->tempKonsumenRepository->findById($id);
            if ($tempKonsumen) {
                $this->tempKonsumenRepository->delete($tempKonsumen);
                return $this->tempKonsumenResponse->deleted('Pengajuan konsumen berhasil dihapus.');
            }

            $konsumen = $this->konsumenRepository->findById($id);
            if ($konsumen) {
                $this->konsumenRepository->delete($konsumen);
                return $this->konsumenResponse->deleted('Data konsumen berhasil dihapus.');
            }

            return $this->tempKonsumenResponse->notFound();
        } catch (Throwable $e) {
            Log::error('Gagal menghapus konsumen: ' . $e->getMessage());
            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function activate(ActiveKonsumenRequest $request, int $id)
    {
        try {
            $tempKonsumen = $this->tempKonsumenRepository->findById($id);

            if (!$tempKonsumen) {
                return $this->tempKonsumenResponse->notFound('Data pengajuan konsumen tidak ditemukan.');
            }

            $status = $request->filled('status')
                ? StatusKonsumen::tryFrom($request->status) ?? StatusKonsumen::Diterima
                : StatusKonsumen::Diterima;

            $isDiterima = $status === StatusKonsumen::Diterima;
            $isRevisi   = $status === StatusKonsumen::Revisi;
            $diverifikasi_oleh = auth()->id();

            $updatedKonsumen = $this->tempKonsumenRepository->activateKonsumen(
                $tempKonsumen,
                $diverifikasi_oleh,
                $isDiterima ? null : ($request->input('note') ?: null),
                $status
            );

            $message = $isDiterima
                ? 'Akun Konsumen berhasil diterima dan dipindahkan ke data konsumen.'
                : ($isRevisi
                    ? 'Pengajuan Konsumen diminta untuk direvisi.'
                    : 'Pengajuan Konsumen berhasil ditolak.');

            return $this->tempKonsumenResponse->success($updatedKonsumen, $message);
        } catch (Throwable $e) {
            Log::error('Aktivasi Konsumen gagal: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->tempKonsumenResponse->serverError();
        }
    }

    public function fotoKtp(Request $request, int $id)
    {
        if ($request->query('type') === 'temp') {
            $konsumen = TempKonsumen::withoutGlobalScopes()->find($id)
                ?? Konsumen::withoutGlobalScopes()->find($id);
        } else {
            $konsumen = Konsumen::withoutGlobalScopes()->find($id)
                ?? TempKonsumen::withoutGlobalScopes()->find($id);
        }

        if (!$konsumen || !$konsumen->foto_ktp) {
            abort(404, 'Foto KTP tidak ditemukan.');
        }

        $storage = StoragePath::Ktp->filesystem();

        if ($storage->exists($konsumen->foto_ktp)) {
            $filePath = $storage->path($konsumen->foto_ktp);
            return response()->file($filePath);
        }

        abort(404, 'Berkas fisik foto KTP tidak ditemukan di server.');
    }

    public function logs(Request $request)
    {
        try {
            $perPage = $this->paginateController->getPerPage($request);

            return ActivityLogResource::collection(
                $this->tempKonsumenRepository->getAllLogs($perPage, $request->query('search'))
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log konsumen: ' . $e->getMessage());
            return $this->tempKonsumenResponse->serverError();
        }
    }
}
