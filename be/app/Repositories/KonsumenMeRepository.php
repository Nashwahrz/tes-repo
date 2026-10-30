<?php

namespace App\Repositories;

use App\Enums\StatusKonsumen;
use App\Models\KonsumenMe;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class KonsumenMeRepository
{
    public function all(): Collection
    {
        return KonsumenMe::all();
    }

    public function findById(int $id): ?KonsumenMe
    {
        return KonsumenMe::find($id);
    }

    public function create(array $data): KonsumenMe
    {
        return KonsumenMe::create($data);
    }

    
    public function update(KonsumenMe $konsumenMe, array $data): KonsumenMe
    {
        $konsumenMe->update($data);
        return $konsumenMe->fresh();
    }

  
    public function delete(KonsumenMe $konsumen): bool
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

 
    public function activateKonsumen(KonsumenMe $konsumen, ?int $diverifikasi_oleh, string|null $catatan_penolakan, StatusKonsumen $status): KonsumenMe
    {
        $konsumen->update([
            'diverifikasi_oleh' => $diverifikasi_oleh,
            'catatan_penolakan' => $catatan_penolakan,
            'status'    => $status
        ]);
        return $konsumen;
    }

    public function paginate(int $perPage = 10, ?string $search = null, ?int $userId = null): LengthAwarePaginator
    {
        $userId ??= auth()->id();

        return KonsumenMe::with(['konsumenMes.me'])
            ->when($userId, fn ($q) => $q->whereHas('konsumenMes', fn ($q) => $q->where('id_me', $userId)))
            ->latest('id')
            ->paginate($perPage);
    }

    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', KonsumenMe::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [KonsumenMe::class], function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);
        return $logs;
    }
  
}
