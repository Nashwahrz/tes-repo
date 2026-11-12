<?php

namespace App\Observers;

use App\Enums\LogAction;
use App\Models\User;
use App\Services\LogActivityUserService;
use Illuminate\Support\Facades\Auth;

class UserObserver
{
    public function __construct(
        protected LogActivityUserService $logService
    ) {}
    public function created(User $user): void
    {
        $this->logService->logCreated($user);
    }

    public function updated(User $user): void
    {
        $changes = $user->getChanges();
        unset($changes['updated_at']);

        if (empty($changes)) {
            return;
        }

        if (isset($changes['password'])) {
            $actor = Auth::user();
            $this->logService->record([
                'fk_user'     => $user->id,
                'user_name'   => $user->name,
                'fk_causer'   => $actor?->id ?? $user->id,
                'causer_name' => $actor?->name ?? $user->name,
                'action'      => LogAction::PasswordChanged,
                'description' => sprintf('Password akun %s (%s) telah diubah.', $user->name, $user->email),
                'old_data'    => null,
                'new_data'    => null,
            ]);
            unset($changes['password']);
        }

        if (empty($changes)) {
            return;
        }

        if (isset($changes['status'])) {
            $rawOld = $user->getOriginal('status');
            $rawNew = $changes['status'];

            $oldStatus = $rawOld instanceof \BackedEnum ? $rawOld->value : (string) $rawOld;
            $newStatus = $rawNew instanceof \BackedEnum ? $rawNew->value : (string) $rawNew;

            $this->logService->logStatusChanged($user, $oldStatus, $newStatus);
            unset($changes['status']);
        }

        if (empty($changes)) {
            return;
        }

      
        $this->logService->logUpdated($user, $user->getOriginal(), $changes);
    }

    public function deleted(User $user): void
    {
        $this->logService->logDeleted($user);
    }
}

