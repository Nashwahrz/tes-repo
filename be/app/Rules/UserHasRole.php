<?php

namespace App\Rules;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class UserHasRole implements ValidationRule
{
    public function __construct(private string $roleName) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $valid = User::where('id', $value)
            ->whereHas('role', fn ($q) => $q->where('name', $this->roleName))
            ->exists();

        if (!$valid) {
            $fail("User yang dipilih bukan {$this->roleName} atau tidak terdaftar.");
        }
    }
}