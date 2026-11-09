<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\StatusUser;
use App\Models\Scopes\DealerScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

#[ScopedBy([DealerScope::class])]
class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */

    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('user')
            ->logOnly(['name', 'email', 'status', 'fk_dealer', 'fk_atasan', 'fk_role'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
    protected $fillable = [
        'name',
        'email',
        'password',
        'email_verification',
        'status',
        'photo',
        'fk_dealer',
        'fk_atasan',
        'fk_role',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'email_verification'  => 'boolean',
            'status'            => StatusUser::class,
        ];
    }

    public function dealer()
    {
        return $this->belongsTo(Dealer::class, 'fk_dealer');
    }
    public function atasan()
    {
        return $this->belongsTo(User::class, 'fk_atasan');
    }
    public function role()
    {
        return $this->belongsTo(Role::class, 'fk_role');
    }

    public function otps()
    {
        return $this->hasMany(Otp::class, 'fk_user');
    }

    public function logUsers()
    {
        return $this->hasMany(LogUser::class, 'fk_user');
    }

    public function hasPermission(string $permission): bool
    {
        if (!$this->fk_role || !$this->role) {
            return false;
        }

        return $this->role->permissions()
            ->where('permission_name', $permission)
            ->exists();
    }

    public function hasAnyPermission(array $permissions): bool
    {
        if (!$this->fk_role || !$this->role) {
            return false;
        }

        return $this->role->permissions()
            ->whereIn('permission_name', $permissions)
            ->exists();
    }
    protected function email(): Attribute
    {
        return Attribute::make(
            set: fn(string $value) => strtolower(trim($value)),
        );
    }
}

