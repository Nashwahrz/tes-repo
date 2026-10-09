<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class DealerModelScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        if (Auth::check()) {
            $user = Auth::user();

            $roleName = $user->relationLoaded('role')
                ? $user->role?->name
                : $user->role()->value('name');

            if ($roleName !== 'Manager' && $user->id_dealer) {
                $builder->where($model->getTable() . '.id', $user->id_dealer);
            }
        }
    }
}
