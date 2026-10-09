<?php

namespace App\Models;

use App\Models\Scopes\DealerModelScope;
use Illuminate\Database\Eloquent\Attributes\ScopedBy;
use Illuminate\Database\Eloquent\Model;

#[ScopedBy([DealerModelScope::class])]
class Dealer extends Model
{
    protected $fillable = [
        'name',
        'alamat',
        'latitude',
        'longitude',
    ];
}
