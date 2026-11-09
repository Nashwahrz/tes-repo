<?php

namespace App\Repositories;


use App\Models\EmailWhitelist;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class EmailWhitelistRepository 
{
    public function all(): Collection
    {
        return EmailWhitelist::all();
    }

    public function findById(int $id): ?EmailWhiteList
    {
        return EmailWhitelist::find($id);
    }

   
    public function create(array $data): EmailWhitelist
    {
        return EmailWhitelist::create($data);
    }

    
    public function update(EmailWhitelist $email, array $data): EmailWhitelist
    {
        $email->update($data);
        return $email->fresh();
    }

  
    public function delete(EmailWhitelist $email): bool
    {
        return (bool) $email->delete();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', EmailWhitelist::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [EmailWhitelist::class], function ($q) use ($search) {
                            $q->where('domain', 'like', "%{$search}%");
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
                data_get($log->properties, 'old.fk_me'),
                data_get($log->properties, 'attributes.fk_me'),
                data_get($log->properties, 'old.diverifikasi_oleh'),
                data_get($log->properties, 'attributes.diverifikasi_oleh'),
            ])
            ->filter()
            ->unique()
            ->values();

        $users = EmailWhitelist::whereIn('id', $userIds)->pluck('domain', 'id');

        $logs->getCollection()->each(
            fn ($log) => $log->setRelation('users_map', $users)
        );
    }  
}
