<?php

namespace App\Repositories;

use App\Enums\StatusKonsumen;
use App\Models\Konsumen;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class KonsumenRepository
{
    public function all(): Collection
    {
        return Konsumen::all();
    }

    public function findById(int|string $id): ?Konsumen
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
        return Konsumen::with(['me', 'verifiedBy'])
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
        return $konsumen->fresh(['me', 'verifiedBy']);
    }

    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Konsumen::query()
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
