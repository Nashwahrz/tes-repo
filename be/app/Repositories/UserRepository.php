<?php

namespace App\Repositories;

use App\Enums\StatusUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

use App\Models\Role;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;

class UserRepository
{
    public function create(array $data): User
    {
        return User::create(collect($data)->except('password_confirmation')->toArray());
    }

    public function findById(int|string $id): ?User
    {
        return User::with(['role', 'dealer', 'atasan'])->find($id);
    }

    public function activateUser(User $user, ?int $dealerId, ?int $atasanId, StatusUser $status = StatusUser::Aktif): User
    {
        $user->update([
            'fk_dealer' => $dealerId,
            'fk_atasan' => $atasanId,
            'status'    => $status,
        ]);

        return $user->fresh(['role', 'dealer', 'atasan']);
    }

    public function getAtasanOptions(Role $role, ?int $dealerId = null): Collection
    {
    
        $roleName = $role->getAttribute('name');

        $targetRoles = match ($roleName) {
            'Kasir' => ['ADH'],
            'ME'    => ['Kacab'],
            'ADH'   => ['Super Admin'],
            'Kacab' => ['Super Admin'],
            default => [],
        };

        if (empty($targetRoles)) {
            return new Collection();
        }

        $query = User::with(['role:id,name', 'dealer:id,name'])
            ->whereHas('role', function ($q) use ($targetRoles) {
                $q->whereIn('name', $targetRoles);
            })
            ->where('status', StatusUser::Aktif);

        if ($dealerId && !in_array('Super Admin', $targetRoles)) {
            $query->where('fk_dealer', $dealerId);
        }

        return $query->get();
    }

    public function getUsers(?StatusUser $status = null): Collection
    {
        $query = User::with(['role', 'dealer', 'atasan']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }

    public function paginate(?StatusUser $status = null, int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return User::query()
            ->with(['role', 'dealer', 'atasan'])
            ->where('email_verification', true)
            ->when($status, fn ($q) => $q->where('status', $status))
            ->when($search, fn ($q) => $q->where('name', 'ILIKE', "%{$search}%"))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', User::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [User::class], function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%");
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

        $users = User::whereIn('id', $userIds)->pluck('name', 'id');

        $logs->getCollection()->each(
            fn ($log) => $log->setRelation('users_map', $users)
        );
    }  
}
