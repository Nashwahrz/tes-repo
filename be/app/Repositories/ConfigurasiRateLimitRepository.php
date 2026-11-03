<?php

namespace App\Repositories;

use App\Models\ConfigurasiRateLimit;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

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
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', ConfigurasiRateLimit::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [ConfigurasiRateLimit::class], function ($q) use ($search) {
                            $q->where('name', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

      
        return $logs;
    }
}
