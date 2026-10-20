<?php

namespace App\Repositories;

use App\Models\Kelurahan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class KelurahanRepository
{
   
    public function findById(int $id): ?Kelurahan
    {
        return Kelurahan::find($id);
    }

   
    public function create(array $data): Kelurahan
    {
        return Kelurahan::create($data);
    }

    
    public function update(Kelurahan $kelurahan, array $data): Kelurahan
    {
        $kelurahan->update($data);
        return $kelurahan->fresh();
    }

  
    public function delete(Kelurahan $kelurahan): bool
    {   
        return (bool) $kelurahan->delete();
    }
    public function paginate(int $perPage = null, ?string $search = null): LengthAwarePaginator
    {
        return Kelurahan::query()
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
