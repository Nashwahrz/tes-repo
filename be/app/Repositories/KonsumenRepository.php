<?php

namespace App\Repositories;

use App\Enums\StatusKonsumen;
use App\Models\Konsumen;
use App\Models\KonsumenMe;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class KonsumenRepository
{
    public function all(): Collection
    {
        return Konsumen::all();
    }

    public function findById(int $id): ?Konsumen
    {
        return Konsumen::find($id);
    }

    public function findByNik(string $nik): ?Konsumen
    {
        return Konsumen::where('nik', $nik)->first();
    }

    public function searchByNik(string $keyword, int $limit = 10): Collection
    {
        return Konsumen::where(function ($q) use ($keyword) {
            $q->where('nik', 'ILIKE', "%{$keyword}%")
              ->orWhere('name', 'ILIKE', "%{$keyword}%");
        })
        ->limit($limit)
        ->get();
    }

   
    public function storeWithMe(array $data, int $userId, bool $hasNewPhoto = false): array
    {
        return DB::transaction(function () use ($data, $userId, $hasNewPhoto) {
            $konsumen = $this->findByNik($data['nik']);

            if ($konsumen) {
                $isDataChanged = $hasNewPhoto;
                $konsumen->fill($data);
                if ($konsumen->isDirty()) {
                    $isDataChanged = true;
                }
                $lastAccepted = $konsumen->konsumenMes()
                    ->where('status', StatusKonsumen::Diterima)
                    ->whereNotNull('diverifikasi_oleh')
                    ->latest('id')
                    ->first();

                $isDiterima = false;
                $diverifikasiOleh = null;

                if ($lastAccepted) {
                    $isDiterima = true;
                    $diverifikasiOleh = $lastAccepted->diverifikasi_oleh;
                } elseif ($konsumen->status === StatusKonsumen::Diterima && $konsumen->diverifikasi_oleh) {
                    $isDiterima = true;
                    $diverifikasiOleh = $konsumen->diverifikasi_oleh;
                }
                if (!$isDataChanged && $isDiterima) {
                    $statusMe         = StatusKonsumen::Diterima;
                    $verifiedBy       = $diverifikasiOleh;
                    $catatanPenolakan = null;
                } else {
                    $statusMe         = StatusKonsumen::Pending;
                    $verifiedBy       = null;
                    $catatanPenolakan = null;
                }

                $konsumen = $this->update($konsumen, $data);
                KonsumenMe::firstOrCreate(
                    [
                        'id_me'       => $userId,
                        'id_konsumen' => $konsumen->id,
                    ],
                    [
                        'status'            => $statusMe,
                        'diverifikasi_oleh' => $verifiedBy,
                        'catatan_penolakan' => $catatanPenolakan,
                    ]
                );

                return [$konsumen, true];
            }

            $konsumen = $this->create($data);

            KonsumenMe::create([
                'id_me'             => $userId,
                'id_konsumen'       => $konsumen->id,
                'status'            => StatusKonsumen::Pending,
                'diverifikasi_oleh' => null,
                'catatan_penolakan' => null,
            ]);

            return [$konsumen, false];
        });
    }

    public function create(array $data): Konsumen
    {
        return Konsumen::create($data);
    }

    
    public function update(Konsumen $konsumen, array $data): Konsumen
    {
        $konsumen->update($data);
        return $konsumen->fresh();
    }

  
    public function delete(Konsumen $konsumen): bool
    {
        return (bool) $konsumen->delete();
    }
    // public function getStatus(?StatusKonsumen $status = null): Collection
    // {
    //     $query = Konsumen::with(['me', 'verifiedBy']);

    //     if ($status) {
    //         $query->where('status', $status);
    //     }

    //     return $query->get();
    // }

    public function getStatus(?StatusKonsumen $status = null, int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Konsumen::with(['konsumenMes.me', 'verifiedBy'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                    ->orWhere('nik', 'like', "%{$search}%");
                });
            })
            ->latest('id')
            ->paginate($perPage);
    }
    public function activateKonsumen(Konsumen $konsumen, ?int $diverifikasi_oleh, string|null $catatan_penolakan, StatusKonsumen $status): Konsumen
    {
        $konsumen->update([
            'diverifikasi_oleh' => $diverifikasi_oleh,
            'catatan_penolakan' => $catatan_penolakan,
            'status'    => $status
        ]);
        return $konsumen->fresh(['konsumenMes.me', 'verifiedBy']);
    }

    public function paginate(int $perPage = 10, ?string $search = null, ?int $userId = null): LengthAwarePaginator
    {
        $userId ??= auth()->id();

        return Konsumen::with(['konsumenMes.me'])
            ->when($userId, fn ($q) => $q->whereHas('konsumenMes', fn ($q) => $q->where('id_me', $userId)))
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
        return Konsumen::with(['konsumenMes.me'])
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
            ->where('subject_type', Konsumen::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Konsumen::class], function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
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
                data_get($log->properties, 'old.id_me'),
                data_get($log->properties, 'attributes.id_me'),
                data_get($log->properties, 'old.diverifikasi_oleh'),
                data_get($log->properties, 'attributes.diverifikasi_oleh'),
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
