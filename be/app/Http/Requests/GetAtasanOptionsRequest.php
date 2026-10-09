<?php

namespace App\Http\Requests;

use App\Http\Responses\UserResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class GetAtasanOptionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'id_role'   => ['required', 'integer', 'exists:roles,id'],
            'id_dealer' => ['nullable', 'integer', 'exists:dealers,id'],
        ];
    }

    /**
     * Custom validation messages in Indonesian.
     */
    public function messages(): array
    {
        return [
            'id_role.required'  => 'ID role wajib diisi.',
            'id_role.integer'   => 'ID role harus berupa angka.',
            'id_role.exists'    => 'Role tidak ditemukan.',
            'id_dealer.integer' => 'ID dealer harus berupa angka.',
            'id_dealer.exists'  => 'Dealer tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(UserResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
