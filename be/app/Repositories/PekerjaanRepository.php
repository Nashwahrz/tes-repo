<?php

namespace App\Repositories;

use App\Models\Pekerjaan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class PekerjaanRepository
{
   
    public function findById(int $id): ?Pekerjaan
    {
        return Pekerjaan::find($id);
    }

   
    public function create(array $data): Pekerjaan
    {
        return Pekerjaan::create($data);
    }

    
    public function update(Pekerjaan $dealer, array $data): Pekerjaan
    {
        $dealer->update($data);
        return $dealer->fresh();
    }

  
    public function delete(Pekerjaan $dealer): bool
    {
        return (bool) $dealer->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Pekerjaan::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Pekerjaan::class], function ($q) use ($search) {
                            $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                            ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
}
