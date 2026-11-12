<?php

namespace App\Repositories;

use App\Enums\RoleEnum;
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
    
        $roleName = $role->role_name ?? $role->getAttribute('role_name') ?? $role->getAttribute('name');

        $targetRoles = match ($roleName) {
            RoleEnum::Kasir->value => [RoleEnum::Adh->value],
            RoleEnum::Me->value    => [RoleEnum::Kacab->value],
            RoleEnum::Adh->value   => [RoleEnum::SuperAdmin->value],
            RoleEnum::Kacab->value => [RoleEnum::SuperAdmin->value],
            default => [],
        };

        if (empty($targetRoles)) {
            return new Collection();
        }

        $query = User::with(['role', 'dealer'])
            ->whereHas('role', function ($q) use ($targetRoles) {
                $q->whereIn('role_name', $targetRoles);
            })
            ->where('status', StatusUser::Aktif);

        if ($dealerId && !in_array(RoleEnum::SuperAdmin->value, $targetRoles)) {
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
        return app(LogActivityUserRepository::class)->paginate($perPage, $search);
    }  
}
