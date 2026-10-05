<?php

namespace App\Http\Requests;

use App\Http\Responses\RoleMenuResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class RoleMenuRequest extends FormRequest
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
            'menu_ids'   => ['present', 'array'],
            'menu_ids.*' => ['integer', 'exists:menus,id'],
        ];
    }

    /**
     * Custom validation messages in Indonesian.
     */
    public function messages(): array
    {
        return [
            'menu_ids.present'   => 'Daftar menu (menu_ids) harus disertakan.',
            'menu_ids.array'     => 'Daftar menu harus berupa array.',
            'menu_ids.*.integer' => 'ID menu harus berupa angka.',
            'menu_ids.*.exists'  => 'Salah satu ID menu yang dipilih tidak terdaftar di sistem.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(RoleMenuResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
