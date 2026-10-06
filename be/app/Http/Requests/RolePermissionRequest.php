<?php

namespace App\Http\Requests;

use App\Http\Responses\RolePermissionResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RolePermissionRequest extends FormRequest
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
            'permission_ids'   => ['present', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'permission_ids.present'   => 'Daftar permission (permission_ids) harus disertakan.',
            'permission_ids.array'     => 'Daftar permission harus berupa array.',
            'permission_ids.*.integer' => 'ID permission harus berupa angka.',
            'permission_ids.*.exists'  => 'Salah satu ID permission yang dipilih tidak terdaftar di sistem.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(RolePermissionResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
