<?php

namespace App\Repositories;

use App\Models\Pekerjaan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

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
                $q->where('name', 'ILIKE', "%{$search}%")
                ->orWhere('kode', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
