<?php

namespace App\Models;

use App\Enums\TypeHeaderPekerjaan;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Pekerjaan extends Model
{
    use LogsActivity;

    protected $table = 'master.pekerjaans';

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->useLogName('pekerjaan')
            ->logOnly(['pekerjaan_code', 'pekerjaan_name', 'sequence', 'type_header', 'sector_job', 'id_parent', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    protected $fillable = [
        'pekerjaan_code',
        'pekerjaan_name',
        'sequence',
        'type_header',
        'sector_job',
        'id_parent',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'type_header' => TypeHeaderPekerjaan::class,
            'status'      => 'boolean',
            'sequence'    => 'integer',
        ];
    }
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'id_parent', 'pekerjaan_code')
            ->where('type_header', TypeHeaderPekerjaan::Detail);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'id_parent', 'pekerjaan_code')
            ->where('type_header', TypeHeaderPekerjaan::Header);
    }
}

