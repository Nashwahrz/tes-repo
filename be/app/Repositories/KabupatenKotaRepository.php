<?php

namespace App\Repositories;

use App\Models\KabupatenKota;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

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
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
