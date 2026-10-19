<?php

namespace App\Repositories;

use App\Models\Provinsi;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ProvinsiRepository
{
   
    public function findById(int $id): ?Provinsi
    {
        return Provinsi::find($id);
    }

   
    public function create(array $data): Provinsi
    {
        return Provinsi::create($data);
    }

    
    public function update(Provinsi $provinsi, array $data): Provinsi
    {
        $provinsi->update($data);
        return $provinsi->fresh();
    }

  
    public function delete(Provinsi $provinsi): bool
    {
        return (bool) $provinsi->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Provinsi::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
