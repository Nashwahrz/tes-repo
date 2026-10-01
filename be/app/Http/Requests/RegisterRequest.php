<?php

namespace App\Http\Requests;

use App\Http\Responses\RegisterResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'      => ['required', 'string', 'max:255'],
            'email'     => ['required', 'email', 'max:255', 'unique:users,email'],
            'password'  => ['required', 'string', 'min:8', 'confirmed'],
            'id_dealer' => ['nullable', 'exists:dealers,id'],
            'id_atasan' => ['nullable', 'exists:users,id'],
            'id_role'   => ['required', 'exists:roles,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Nama wajib diisi.',
            'email.required'     => 'Email wajib diisi.',
            'email.email'        => 'Format email tidak valid.',
            'email.unique'       => 'Email sudah terdaftar.',
            'password.required'  => 'Password wajib diisi.',
            'password.min'       => 'Password minimal 8 karakter.',
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
}