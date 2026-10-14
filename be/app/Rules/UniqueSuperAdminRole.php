<?php

namespace App\Rules;

use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UniqueSuperAdminRole implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $SuperAdminRole = Role::where('name', 'Super Admin')->first();

        if ($SuperAdminRole && (int) $value === $SuperAdminRole->id) {
            $SuperAdminExists = User::where('id_role', $SuperAdminRole->id)->exists();

            if ($SuperAdminExists) {
                $fail('Data tidak bisa diisi');
            }
        }
    }
}