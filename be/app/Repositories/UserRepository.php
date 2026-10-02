<?php

namespace App\Repositories;

use App\Enums\StatusUser;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

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
     * Activate user account and assign dealer ID.
     */
    public function activateUser(User $user, int $dealerId, StatusUser $status = StatusUser::Aktif): User
    {
        $user->update([
            'id_dealer' => $dealerId,
            'status'    => $status,
        ]);

        return $user->fresh(['role', 'dealer', 'atasan']);
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
