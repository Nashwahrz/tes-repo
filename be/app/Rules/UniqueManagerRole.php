<?php

namespace App\Rules;

use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueManagerRole implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $managerRole = Role::where('name', 'Manager')->first();

        if ($managerRole && (int) $value === $managerRole->id) {
            $managerExists = User::where('id_role', $managerRole->id)->exists();

            if ($managerExists) {
                $fail('Data tidak bisa diisi');
            }
        }
    }
}