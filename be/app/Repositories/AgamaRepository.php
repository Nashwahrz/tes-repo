<?php

namespace App\Repositories;

use App\Models\Agama;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class AgamaRepository
{
    // public function all(): Collection
    // {
    //     return Agama::all();
    // }

    public function findById(int|string $id): ?Agama
    {
        return Agama::find($id);
    }

   
    public function create(array $data): Agama
    {
        return Agama::create($data);
    }

    
    public function update(Agama $dealer, array $data): Agama
    {
        $dealer->update($data);
        return $dealer->fresh();
    }

  
    public function delete(Agama $dealer): bool
    {
        return (bool) $dealer->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Agama::query()
            ->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
