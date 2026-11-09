<?php

namespace App\Repositories;

use App\Models\KabupatenKota;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class KabupatenKotaRepository
{
   
    public function findById(int $id): ?KabupatenKota
    {
        return KabupatenKota::find($id);
    }

   
    public function create(array $data): KabupatenKota
    {
        return KabupatenKota::create($data);
    }

    
    public function update(KabupatenKota $kabupatenKota, array $data): KabupatenKota
    {
        $kabupatenKota->update($data);
        return $kabupatenKota->fresh();
    }

  
    public function delete(KabupatenKota $kabupatenKota): bool
    {
        return (bool) $kabupatenKota->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', KabupatenKota::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [KabupatenKota::class], function ($q) use ($search) {
                            $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                            ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

      
        return $logs;
    }
}
