<?php

namespace App\Repositories;

use App\Enums\StatusKonsumen;
use App\Models\Konsumen;
use Illuminate\Database\Eloquent\Collection;

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
    public function getStatus(?StatusKonsumen $status = null): Collection
    {
        $query = Konsumen::with(['me', 'verifiedBy']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }
}
