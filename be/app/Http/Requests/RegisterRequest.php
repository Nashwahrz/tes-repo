<?php

namespace App\Http\Requests;

use App\Http\Responses\RegisterResponse;
use App\Models\Role;
use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255', 'regex:/^[a-zA-Z\s]+$/'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'confirmed',Password::min(8)->mixedCase()->numbers()->symbols(),],
            'id_dealer' => ['nullable', 'exists:dealers,id'],
            'id_atasan' => ['nullable', 'exists:users,id'],
            'id_role'   => [
                'required',
                'exists:roles,id',
                function (string $attribute, mixed $value, Closure $fail) {
                    $managerRole = Role::where('name', 'Manager')->first();

                    if ($managerRole && (int) $value === $managerRole->id) {
                        $managerExists = User::where('id_role', $managerRole->id)->exists();

                        if ($managerExists) {
                            $fail('Data tidak bisa diisi');
                        }
                    }
                },
            ],
        ];
    }
    

    public function messages(): array
    {
        return [
            'name.required'      => 'Nama wajib diisi.',
            'name.regex'         => 'Nama tidak boleh mengandung simbol atau angka.',
            'email.required'     => 'Email wajib diisi.',
            'email.email'        => 'Format email tidak valid.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.required'  => 'Password wajib diisi.',
            'password.min'       => 'Password minimal 8 karakter.',
            'password.regex'     => 'Password harus mengandung huruf besar, huruf kecil, dan simbol.',
            'password.confirmed' => 'Konfirmasi password tidak cocok.',
            'id_dealer.exists'   => 'Dealer tidak ditemukan.',
            'id_atasan.exists'   => 'Atasan tidak ditemukan.',
            'id_role.exists'     => 'Role tidak ditemukan.',
            'id_role.required'   => 'Role wajib dipilih.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(RegisterResponse::class)->validationError($validator->errors()->toArray())
        );
    }
    protected function prepareForValidation(): void
    {
        if ($this->has('email')) {
            $this->merge([
                'email' => strtolower(trim($this->email)),
            ]);
        }
    }

}