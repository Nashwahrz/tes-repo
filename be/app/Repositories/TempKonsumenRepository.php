<?php

namespace App\Repositories;

use App\Enums\StatusKonsumen;
use App\Enums\TypeTempKonsumen;
use App\Models\Konsumen;
use App\Models\KonsumenMe;
use App\Models\TempKonsumen;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class TempKonsumenRepository
{
    public function all(): Collection
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])->get();
    }

    public function findById(int $id): ?TempKonsumen
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])->find($id);
    }

    public function findByNik(string $nik): ?TempKonsumen
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->where('nik', $nik)
            ->latest('id')
            ->first();
    }

    public function searchByNik(string $keyword, int $limit = 10): Collection
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->where(function ($q) use ($keyword) {
                $q->where('nik', 'ILIKE', "%{$keyword}%")
                  ->orWhere('name', 'ILIKE', "%{$keyword}%");
            })
            ->limit($limit)
            ->get();
    }

    public function storeWithMe(array $data, int $userId, bool $hasNewPhoto = false): array
    {
        return DB::transaction(function () use ($data, $userId, $hasNewPhoto) {
            $nik = $data['nik'];

            $existingKonsumen = Konsumen::where('nik', $nik)->first();

            $existingTemp = TempKonsumen::where('fk_me', $userId)
                ->where('nik', $nik)
                ->whereIn('status', [StatusKonsumen::Pending, StatusKonsumen::Revisi])
                ->latest('id')
                ->first();

            $isDataChanged = $hasNewPhoto;
            $diffSebelumnya = [];

            if ($existingKonsumen) {
                $fieldsToCompare = [
                    // 'name', 'fk_temp_lahir', 'birth_date', 'gender',
                    // 'ktp_address', 'domicile_address', 'latitude', 'longitude',
                    // 'rt', 'rw', 'fk_kelurahan', 'fk_kecamatan',
                    // 'fk_kabupaten_kota', 'fk_provinsi', 'fk_agama',
                    // 'marital_status', 'fk_pekerjaan', 'nationality',
                    // 'phone', 'email'
                    'konsumen_name',
                    'fk_temp_lahir',
                    'birth_date',
                    'gender',
                    'ktp_address',
                    'domicile_address',
                    'latitude',
                    'longitude',
                    'rt',
                    'rw',
                    'fk_kelurahan',
                    'fk_kecamatan',
                    'fk_kabupaten_kota',
                    'fk_provinsi',
                    'fk_agama',
                    'marital_status',
                    'fk_pekerjaan',
                    'nationality',
                    'phone',
                    'email',
                   // 'foto_ktp',
                ];

                foreach ($fieldsToCompare as $field) {
                    if (!array_key_exists($field, $data)) {
                        continue;
                    }

                    $oldVal = $existingKonsumen->{$field};
                    $newVal = $data[$field];

                    if ($oldVal instanceof \BackedEnum) {
                        $oldVal = $oldVal->value;
                    }
                    if ($newVal instanceof \BackedEnum) {
                        $newVal = $newVal->value;
                    }

                    if ($field === 'birth_date') {
                        $oldVal = $oldVal ? Carbon::parse($oldVal)->format('Y-m-d') : null;
                        $newVal = $newVal ? Carbon::parse($newVal)->format('Y-m-d') : null;
                    }

                    if (in_array($field, ['latitude', 'longitude']) && $oldVal !== null && $newVal !== null) {
                        $oldVal = number_format((float)$oldVal, 7, '.', '');
                        $newVal = number_format((float)$newVal, 7, '.', '');
                    }

                    $strOld = trim((string)$oldVal);
                    $strNew = trim((string)$newVal);

                    if ($strOld !== $strNew) {
                        $isDataChanged = true;
                        $diffSebelumnya[$field] = $oldVal;
                    }
                }

                if ($hasNewPhoto) {
                    $diffSebelumnya['foto_ktp'] = $existingKonsumen->foto_ktp;
                }
            }
            if ($existingKonsumen && !$isDataChanged) {
                KonsumenMe::firstOrCreate([
                    'fk_me'       => $userId,
                    'fk_konsumen' => $existingKonsumen->id,
                ]);

                if ($existingTemp) {
                    $existingTemp->delete();
                }

                return [
                    $existingKonsumen->load(['konsumenMes.me']),
                    true,
                    false
                ];
            }

            $tipe = $existingKonsumen ? TypeTempKonsumen::Edit : TypeTempKonsumen::Tambah;
            $idKonsumen = $existingKonsumen?->id;
            $dataSebelumnya = $diffSebelumnya;
            if (!$hasNewPhoto && empty($data['foto_ktp']) && $existingKonsumen?->foto_ktp) {
                $data['foto_ktp'] = $existingKonsumen->foto_ktp;
            }

            $payload = array_merge($data, [
                'fk_me'             => $userId,
                'fk_konsumen'       => $idKonsumen,
                'type'              => $tipe,
                'status'            => StatusKonsumen::Pending,
                'note'           => null,
                'old_data'   => $dataSebelumnya,
                'verified_by' => null,
                'verified_at'   => null,
            ]);

            if ($existingTemp) {
                if (!$hasNewPhoto && !isset($payload['foto_ktp'])) {
                    unset($payload['foto_ktp']);
                }
                $existingTemp->update($payload);
                return [$existingTemp->fresh(['me.dealer', 'verifiedBy', 'konsumen']), (bool) $existingKonsumen, $isDataChanged];
            }

            $tempKonsumen = TempKonsumen::create($payload);
            return [$tempKonsumen->load(['me.dealer', 'verifiedBy', 'konsumen']), (bool) $existingKonsumen, $isDataChanged];
        });
    }

    public function create(array $data): TempKonsumen
    {
        return TempKonsumen::create($data);
    }

    public function update(TempKonsumen $konsumen, array $data): TempKonsumen
    {
        $konsumen->update($data);
        return $konsumen->fresh(['me.dealer', 'verifiedBy', 'konsumen']);
    }

    public function delete(TempKonsumen $konsumen): bool
    {
        return (bool) $konsumen->delete();
    }

    public function getStatus(
        ?StatusKonsumen $status = null,
        int $perPage = 10,
        ?string $search = null,
        ?int $userId = null,
        ?int $dealerId = null
    ): LengthAwarePaginator {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($userId, fn ($q) => $q->where('fk_me', $userId))
            ->when($dealerId, fn ($q) => $q->whereHas('me', fn ($q) => $q->where('id_dealer', $dealerId)))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage);
    }

    public function activateKonsumen(
        TempKonsumen $tempKonsumen,
        ?int $verified_by,
        ?string $note,
        StatusKonsumen $status
    ): TempKonsumen {
        return DB::transaction(function () use ($tempKonsumen, $verified_by, $note, $status) {
            if ($status === StatusKonsumen::Diterima) {
                $konsumen = null;
                if ($tempKonsumen->fk_konsumen) {
                    $konsumen = Konsumen::find($tempKonsumen->fk_konsumen);
                }
                if (!$konsumen && $tempKonsumen->nik) {
                    $konsumen = Konsumen::where('nik', $tempKonsumen->nik)->first();
                }

                $konsumenData = [
                    'nik'                 => $tempKonsumen->nik,
                    'konsumen_name'                => $tempKonsumen->konsumen_name,
                    'fk_temp_lahir'      => $tempKonsumen->fk_temp_lahir,
                    'birth_date'           => $tempKonsumen->birth_date,
                    'gender'       => $tempKonsumen->gender,
                    'ktp_address'          => $tempKonsumen->ktp_address,
                    'domicile_address'     => $tempKonsumen->domicile_address,
                    'latitude'            => $tempKonsumen->latitude,
                    'longitude'           => $tempKonsumen->longitude,
                    'rt'                  => $tempKonsumen->rt,
                    'rw'                  => $tempKonsumen->rw,
                    'fk_kelurahan'      => $tempKonsumen->fk_kelurahan,
                    'fk_kecamatan'      => $tempKonsumen->fk_kecamatan,
                    'fk_kabupaten_kota' => $tempKonsumen->fk_kabupaten_kota,
                    'fk_provinsi'       => $tempKonsumen->fk_provinsi,
                    'fk_agama'          => $tempKonsumen->fk_agama,
                    'marital_status'   => $tempKonsumen->marital_status,
                    'fk_pekerjaan'      => $tempKonsumen->fk_pekerjaan,
                    'nationality'     => $tempKonsumen->nationality,
                    'phone'             => $tempKonsumen->phone,
                    'email'               => $tempKonsumen->email,
                    'foto_ktp'            => $tempKonsumen->foto_ktp,
                ];

                if (empty($konsumenData['foto_ktp'])) {
                    unset($konsumenData['foto_ktp']);
                }

                $isEditOrRevisi = $tempKonsumen->tipe === TypeTempKonsumen::Edit
                    || $tempKonsumen->tipe === TypeTempKonsumen::Revisi;

                if ($konsumen) {
                    if ($isEditOrRevisi) {
                        $konsumen->update($konsumenData);
                    }
                } else {
                    $konsumen = Konsumen::create($konsumenData);
                }

                if ($tempKonsumen->fk_me) {
                    KonsumenMe::firstOrCreate([
                        'fk_me'       => $tempKonsumen->fk_me,
                        'fk_konsumen' => $konsumen->id,
                    ]);
                }

                $tempKonsumen->update([
                    'fk_konsumen'       => $konsumen->id,
                    'status'            => StatusKonsumen::Diterima,
                    'note'           => null,
                    'verified_by' => $verified_by,
                    'verified_at'   => now(),
                ]);
            } else {
                $tempKonsumen->update([
                    'status'            => $status,
                    'note'           => $note,
                    'verified_by' => $verified_by,
                    'verified_at'   => now(),
                ]);
            }

            return $tempKonsumen->fresh(['me.dealer', 'verifiedBy', 'konsumen']);
        });
    }

    public function paginate(int $perPage = 10, ?string $search = null, ?int $userId = null): LengthAwarePaginator
    {
        $userId ??= auth()->id();

        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->when($userId, fn ($q) => $q->where('fk_me', $userId))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage);
    }

    public function paginateAll(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage);
    }

    public function paginateDealerAll(int $perPage = 10, ?string $search = null, ?int $userId = null, ?int $dealerId = null): LengthAwarePaginator
    {
        return TempKonsumen::with(['me.dealer', 'verifiedBy', 'konsumen'])
            ->when($userId, fn ($q) => $q->where('fk_me', $userId))
            ->when($dealerId, fn ($q) => $q->whereHas('me', fn ($q) => $q->where('id_dealer', $dealerId)))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'ILIKE', "%{$search}%")
                      ->orWhere('nik', 'ILIKE', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage);
    }

    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->whereIn('subject_type', [TempKonsumen::class, Konsumen::class, KonsumenMe::class])
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->whereHasMorph('subject', [TempKonsumen::class, Konsumen::class], function ($q) use ($search) {
                        $q->where('name', 'ILIKE', "%{$search}%")
                          ->orWhere('nik', 'ILIKE', "%{$search}%");
                    });
                });
            })
            ->latest()
            ->paginate($perPage);

        $this->attachUsersMap($logs);

        return $logs;
    }

    private function attachUsersMap(LengthAwarePaginator $logs): void
    {
        $userIds = $logs->getCollection()
            ->flatMap(fn ($log) => [
                data_get($log->properties, 'old.fk_me'),
                data_get($log->properties, 'attributes.fk_me'),
                data_get($log->properties, 'old.verified_by'),
                data_get($log->properties, 'attributes.verified_by'),
            ])
            ->filter()
            ->unique()
            ->values();

        $users = User::whereIn('id', $userIds)->pluck('name', 'id');

        $logs->getCollection()->each(
            fn ($log) => $log->setRelation('users_map', $users)
        );
    }
}
