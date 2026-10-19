<?php

namespace App\Http\Requests;

use App\Http\Responses\ProvinsiResponse;
use App\Models\Provinsi;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class ProvinsiRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
               Rule::unique(Provinsi::class, 'name'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'provinsi wajib diisi.',
            'name.string'        => 'provinsi harus berupa string.',
            'name.max'           => 'provinsi tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'provinsi sudah terdaftar.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(ProvinsiResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
