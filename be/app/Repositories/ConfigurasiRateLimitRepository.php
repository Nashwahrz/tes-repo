<?php

namespace App\Repositories;

use App\Models\ConfigurasiRateLimit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class ConfigurasiRateLimitRepository
{
   
    public function findById(int $id): ?ConfigurasiRateLimit
    {
        return ConfigurasiRateLimit::find($id);
    }

    public function findByName(string $name): ?ConfigurasiRateLimit
    {
        return ConfigurasiRateLimit::where('name', $name)->first();
    }

   
    // public function create(array $data): ConfigurasiRateLimit
    // {
    //     return ConfigurasiRateLimit::create($data);
    // }

    
    public function update(ConfigurasiRateLimit $configurasiRateLimit, array $data): ConfigurasiRateLimit
    {
        $configurasiRateLimit->update($data);
        return $configurasiRateLimit->fresh();
    }

  
    // public function delete(ConfigurasiRateLimit $configurasiRateLimit): bool
    // {
    //     return (bool) $configurasiRateLimit->delete();
    // }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return ConfigurasiRateLimit::query()
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
}
