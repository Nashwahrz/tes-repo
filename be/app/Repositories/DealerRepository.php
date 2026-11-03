<?php

namespace App\Repositories;

use App\Models\Dealer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class DealerRepository
{
    // public function all(): Collection
    // {
    //     return Dealer::all();
    // }

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
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Dealer::query()
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Dealer::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Dealer::class], function ($q) use ($search) {
                            $q->where('name', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

        $this->attachUsersMap($logs);

        return $logs;
    }
    private function attachUsersMap(LengthAwarePaginator $logs): void
    {
        $userIds = $logs->getCollection()
            ->flatMap(fn ($log) => [
                data_get($log->properties, 'old.id_me'),
                data_get($log->properties, 'attributes.id_me'),
                data_get($log->properties, 'old.diverifikasi_oleh'),
                data_get($log->properties, 'attributes.diverifikasi_oleh'),
            ])
            ->filter()
            ->unique()
            ->values();

        $users = Dealer::whereIn('id', $userIds)->pluck('name', 'id');

        $logs->getCollection()->each(
            fn ($log) => $log->setRelation('users_map', $users)
        );
    }  
}
