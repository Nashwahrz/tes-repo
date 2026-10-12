<?php

namespace App\Rules;

use App\Models\EmailWhitelist;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class AllowedEmailDomain implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $domain = strtolower(substr(strrchr($value, '@'), 1));

        $allowed = EmailWhitelist::where('domain', $domain)
            ->where('is_active', true)
            ->exists();

        if (!$allowed) {
            $fail('Domain email tidak diizinkan untuk registrasi.');
        }
    }
}