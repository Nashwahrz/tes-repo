<?php

namespace App\Repositories;

use App\Models\Dealer;
use Illuminate\Database\Eloquent\Collection;

class DealerRepository
{
    public function all(): Collection
    {
        return Dealer::all();
    }

    public function findById(int|string $id): ?Dealer
    {
        return Dealer::find($id);
    }

   
    public function create(array $data): Dealer
    {
        return Dealer::create($data);
    }

    
    public function update(Dealer $dealer, array $data): Dealer
    {
        $dealer->update($data);
        return $dealer->fresh();
    }

  
    public function delete(Dealer $dealer): bool
    {
        return (bool) $dealer->delete();
    }
}
