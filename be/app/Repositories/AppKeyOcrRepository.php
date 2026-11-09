<?php

namespace App\Repositories;

use App\Models\AppKeyOcr;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;


class AppKeyOcrRepository
{
    public function all(): Collection
    {
        return AppKeyOcr::all();
    }
   
    public function update(AppKeyOcr $appKeyOcr, array $data): AppKeyOcr
    {
        $appKeyOcr->update($data);
        Cache::forget('active_app_key_ocr');
        return $appKeyOcr->fresh();
    }
    public function findById(int $id): ?AppKeyOcr
    {
        return AppKeyOcr::find($id);
    }

    public function getActive(): ?AppKeyOcr
    {
        return Cache::remember('active_app_key_ocr', 3600, function () {
            return AppKeyOcr::where('status', true)->first();
        });
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', AppKeyOcr::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [AppKeyOcr::class], function ($q) use ($search) {
                            $q->where('api_key', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
}
