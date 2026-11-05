<?php

namespace App\Http\Controllers;

use App\Enums\StatusKonsumen;
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
        private KtpOcrService $ktpOcrService
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
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
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
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
            if (!$user->id_dealer) {
                return $this->konsumenResponse->paginated(
                    Konsumen::whereRaw('1 = 0')->paginate(10)
                );
            }
            $konsumens = $this->konsumenRepository->paginateDealerAll(
                perPage: min(max((int) $request->query('per_page', 10), 1), 100),
                search: $request->query('search'),
                userId: null,
                dealerId: $user->id_dealer
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

            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

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
                        "Konsumen dengan NIK {$extractedData['nik']} sudah terdaftar atas nama {$existingKonsumen->name}."
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
                $path     = $file->storeAs('ktp', $filename, 'local');
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
                $path = $file->storeAs('ktp', $filename, 'local');
                $data['foto_ktp'] = $path;
            } elseif (empty($data['foto_ktp'])) {
                unset($data['foto_ktp']);
            }

            $userId = auth()->id();

            $tempKonsumen = $this->tempKonsumenRepository->findById($id);

            if ($tempKonsumen) {
                if ($tempKonsumen->status === StatusKonsumen::Diterima) {
                    $data['id_me']             = $userId;
                    $data['id_konsumen']       = $tempKonsumen->id_konsumen;
                    $data['tipe']              = 'edit';
                    $data['status']            = StatusKonsumen::Pending;
                    $data['catatan']           = null;
                    $data['diverifikasi_oleh'] = null;
                    $data['diverifikasi_at']   = null;
                    $updated = $this->tempKonsumenRepository->create($data);
                } else {
                    $data['status']            = StatusKonsumen::Pending;
                    $data['catatan']           = null;
                    $data['diverifikasi_oleh'] = null;
                    $data['diverifikasi_at']   = null;
                    $updated = $this->tempKonsumenRepository->update($tempKonsumen, $data);
                }

                return $this->tempKonsumenResponse->success($updated, 'Data konsumen berhasil diperbarui dan diajukan kembali.');
            }

            $konsumen = $this->konsumenRepository->findById($id);
            if ($konsumen) {
                $tempData = array_merge($data, [
                    'id_me'             => $userId,
                    'id_konsumen'       => $konsumen->id,
                    'tipe'              => 'edit',
                    'status'            => StatusKonsumen::Pending,
                    'catatan'           => null,
                    'data_sebelumnya'   => $konsumen->toArray(),
                    'diverifikasi_oleh' => null,
                    'diverifikasi_at'   => null,
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
                $isDiterima ? null : ($request->input('catatan_penolakan') ?: null),
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

    public function fotoKtp(int $id)
    {
        $konsumen = Konsumen::withoutGlobalScopes()->find($id)
            ?? TempKonsumen::withoutGlobalScopes()->find($id);

        if (!$konsumen || !$konsumen->foto_ktp) {
            abort(404, 'Foto KTP tidak ditemukan.');
        }

        if (Storage::disk('local')->exists($konsumen->foto_ktp)) {
            $filePath = Storage::disk('local')->path($konsumen->foto_ktp);
            return response()->file($filePath);
        }

        if (Storage::disk('public')->exists($konsumen->foto_ktp)) {
            $filePath = Storage::disk('public')->path($konsumen->foto_ktp);
            return response()->file($filePath);
        }

        abort(404, 'Berkas fisik foto KTP tidak ditemukan di server.');
    }

    public function logs(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);

            return ActivityLogResource::collection(
                $this->tempKonsumenRepository->getAllLogs($perPage, $request->query('search'))
            );
        } catch (Throwable $e) {
            Log::error('Gagal mengambil log konsumen: ' . $e->getMessage());
            return $this->tempKonsumenResponse->serverError();
        }
    }
}
