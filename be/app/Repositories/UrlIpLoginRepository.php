<?php

namespace App\Repositories;

use App\Models\UrlIpLogin;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Spatie\Activitylog\Models\Activity;

class UrlIpLoginRepository
{
    public function all(): Collection
    {
        return UrlIpLogin::all();
    }
   
    public function update(UrlIpLogin $urlIpLogin, array $data): UrlIpLogin
    {
        $urlIpLogin->update($data);
        Cache::forget('active_url_ip_login');
        return $urlIpLogin->fresh();
    }
    public function findById(int $id): ?UrlIpLogin
    {
        return UrlIpLogin::find($id);
    }

    public function getActive(): ?UrlIpLogin
    {
        return Cache::remember('active_url_ip_login', 3600, function () {
            return UrlIpLogin::where('is_active', true)->first();
        });
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', UrlIpLogin::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [UrlIpLogin::class], function ($q) use ($search) {
                            $q->where('url', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        return $logs;
    }
}
