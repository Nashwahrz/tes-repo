<?php

namespace App\Services;

use App\Enums\LogAction;
use App\Models\User;
use App\Models\LogActivityUser;
use App\Repositories\LogActivityUserRepository;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogActivityUserService
{
    private const SENSITIVE_FIELDS = [
        'password',
        'remember_token',
    ];

    public function __construct(
        protected ?LogActivityUserRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityUserRepository::class);
    }

   
    public function logCreated(User $user, ?string $description = null): LogActivityUser
    {
        $actor = Auth::user();
        $desc  = $description ?? sprintf('Menambahkan user baru: %s (%s)', $user->name, $user->email);

        return $this->record([
            'fk_user'     => $user->id,
            'user_name'   => $user->name,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::Created,
            'description' => $desc,
            'old_data'   => null,
            'new_data'   => $this->filterSensitiveData($user->getAttributes()),
        ]);
    }

    public function logUpdated(User $user, array $oldData, array $newData, ?string $description = null): ?LogActivityUser
    {
        $oldFiltered = $this->filterSensitiveData(Arr::only($oldData, array_keys($newData)));
        $newFiltered = $this->filterSensitiveData($newData);

        if (empty($newFiltered)) {
            return null;
        }

        $actor = Auth::user();
        $desc  = $description ?? $this->buildChangeDescription($oldFiltered, $newFiltered, $user);

        return $this->record([
            'fk_user'     => $user->id,
            'user_name'   => $user->name,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::Updated,
            'description' => $desc,
            'old_data'   => $oldFiltered,
            'new_data'   => $newFiltered,
        ]);
    }

 
    public function logStatusChanged(User $user, mixed $oldStatus, mixed $newStatus, ?string $description = null): LogActivityUser
    {
        $actor = Auth::user();

        $oldStr = $oldStatus instanceof \BackedEnum ? $oldStatus->value : (string) $oldStatus;
        $newStr = $newStatus instanceof \BackedEnum ? $newStatus->value : (string) $newStatus;

        $desc  = $description ?? sprintf(
            'Mengubah status user %s dari "%s" menjadi "%s"',
            $user->name,
            $oldStr,
            $newStr
        );

        return $this->record([
            'fk_user'     => $user->id,
            'user_name'   => $user->name,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::StatusChanged,
            'description' => $desc,
            'old_data'    => ['status' => $oldStr],
            'new_data'    => ['status' => $newStr],
        ]);
    }

  
    public function logDeleted(User $user, ?string $description = null): LogActivityUser
    {
        $actor = Auth::user();
        $desc  = $description ?? sprintf('Menghapus user: %s (%s)', $user->name, $user->email);

        return $this->record([
            'fk_user'     => $user->id,
            'user_name'   => $user->name,
            'fk_causer'   => $actor?->id,
            'causer_name' => $actor?->name ?? 'Sistem',
            'action'      => LogAction::Deleted,
            'description' => $desc,
            'old_data'   => $this->filterSensitiveData($user->getAttributes()),
            'new_data'   => null,
        ]);
    }

    // public function logLogin(User $user, ?string $description = null): LogActivityUser
    // {
    //     $desc = $description ?? sprintf('User %s (%s) berhasil login ke sistem.', $user->name, $user->email);

    //     return $this->record([
    //         'fk_user'     => $user->id,
    //         'user_name'   => $user->name,
    //         'fk_causer'   => $user->id,
    //         'causer_name' => $user->name,
    //         'action'      => LogAction::Login,
    //         'description' => $desc,
    //         'old_data'    => null,
    //         'new_data'    => null,
    //     ]);
    // }

    // public function logLogout(User $user, ?string $description = null): LogActivityUser
    // {
    //     $desc = $description ?? sprintf('User %s (%s) logout dari sistem.', $user->name, $user->email);

    //     return $this->record([
    //         'fk_user'     => $user->id,
    //         'user_name'   => $user->name,
    //         'fk_causer'   => $user->id,
    //         'causer_name' => $user->name,
    //         'action'      => LogAction::Logout,
    //         'description' => $desc,
    //         'old_data'    => null,
    //         'new_data'    => null,
    //     ]);
    // }

  
    public function record(array $payload): LogActivityUser
    {
        return $this->repository->create([
            'fk_user'     => $payload['fk_user'] ?? null,
            'user_name'   => $payload['user_name'] ?? null,
            'fk_causer'   => $payload['fk_causer'] ?? null,
            'causer_name' => $payload['causer_name'] ?? null,
            'action'      => $payload['action'],
            'description' => $payload['description'],
            'old_data'   => $payload['old_data'] ?? null,
            'new_data'   => $payload['new_data'] ?? null,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }


    private function buildChangeDescription(array $old, array $new, User $user): string
    {
        $changes = [];
        foreach ($new as $key => $newVal) {
            $oldVal = $old[$key] ?? null;
            $changes[] = sprintf('%s: "%s" -> "%s"', $key, $this->formatValue($oldVal), $this->formatValue($newVal));
        }

        return sprintf('Memperbarui data user %s (%s)', $user->name, implode(', ', $changes));
    }

    private function formatValue(mixed $value): string
    {
        if ($value === null) {
            return '(kosong)';
        }

        if ($value instanceof \BackedEnum) {
            return (string) $value->value;
        }

        if ($value instanceof \UnitEnum) {
            return $value->name;
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }

    public function filterSensitiveData(array $data): array
    {
        $filtered = Arr::except($data, self::SENSITIVE_FIELDS);

        return array_map(function ($val) {
            if ($val instanceof \BackedEnum) {
                return $val->value;
            }
            if ($val instanceof \UnitEnum) {
                return $val->name;
            }
            return $val;
        }, $filtered);
    }
}

