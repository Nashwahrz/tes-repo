<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KonsumenMe extends Model
{
    protected $fillable = [
        'id_me',
        'id_konsumen',
        'status',
        'catatan_penolakan',
        'diverifikasi_oleh',
    ];

    public function me()
    {
        return $this->belongsTo(User::class, 'id_me');
    }

    public function konsumen()
    {
        return $this->belongsTo(Konsumen::class, 'id_konsumen');
    }
    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'diverifikasi_oleh');
    }
}
