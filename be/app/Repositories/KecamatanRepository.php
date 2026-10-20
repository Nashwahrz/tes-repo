<?php

namespace App\Repositories;

use App\Models\Kecamatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class KecamatanRepository
{
   
    public function findById(int $id): ?Kecamatan
    {
        return Kecamatan::find($id);
    }

   
    public function create(array $data): Kecamatan
    {
        return Kecamatan::create($data);
    }

    
    public function update(Kecamatan $kecamatan, array $data): Kecamatan
    {
        $kecamatan->update($data);
        return $kecamatan->fresh();
    }

  
    public function delete(Kecamatan $kecamatan): bool
    {
        return (bool) $kecamatan->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Kecamatan::query()
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
