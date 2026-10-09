<?php

namespace App\Repositories;

use App\Enums\StatusUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

use App\Models\Role;

class UserRepository
{
    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        return User::create(collect($data)->except('password_confirmation')->toArray());
    }

    /**
     * Find user by ID with relations.
     */
    public function findById(int|string $id): ?User
    {
        return User::with(['role', 'dealer', 'atasan'])->find($id);
    }

    /**
     * Activate user account, assign dealer ID and atasan ID.
     */
    public function activateUser(User $user, ?int $dealerId, ?int $atasanId, StatusUser $status = StatusUser::Aktif): User
    {
        $user->update([
            'id_dealer' => $dealerId,
            'id_atasan' => $atasanId,
            'status'    => $status,
        ]);

        return $user->fresh(['role', 'dealer', 'atasan']);
    }

    /**
     * Get atasan options based on role and dealer.
     */
    public function getAtasanOptions(Role $role, ?int $dealerId = null): Collection
    {
    
        $targetRoles = match ($role->name) {
            'Kasir' => ['ADH'],
            'ME'    => ['Kacab'],
            'ADH'   => ['Manager'],
            'Kacab' => ['Manager'],
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

        if ($dealerId && !in_array('Manager', $targetRoles)) {
            $query->where('id_dealer', $dealerId);
        }

        return $query->get();
    }

    /**
     * Get list of users with optional status filter.
     */
    public function getUsers(?StatusUser $status = null): Collection
    {
        $query = User::with(['role', 'dealer', 'atasan']);

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get();
    }
}
