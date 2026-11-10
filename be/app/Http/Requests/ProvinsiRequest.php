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
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'provinsi_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'status' => [
                    'sometimes',
                    'boolean',
                ]
            ];
        }

        return [
            'provinsi_code' => [
                'required',
                'string',
                'size:4',
                Rule::unique(Provinsi::class, 'provinsi_code'),
            ],
            'provinsi_name' => [
                'required',
                'string',
                'max:255',
            ],
            'status' => [
                'sometimes',
                'boolean',
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'provinsi_code.required'      => 'kode provinsi wajib diisi.',
            'provinsi_code.string'        => 'kode provinsi harus berupa string.',
            'provinsi_code.size'          => 'kode provinsi harus terdiri dari 4 digit.',
            'provinsi_code.unique'        => 'kode provinsi sudah terdaftar.',
            'provinsi_name.required'      => 'provinsi wajib diisi.',
            'provinsi_name.string'        => 'provinsi harus berupa string.',
            'provinsi_name.max'           => 'provinsi tidak boleh lebih dari 255 karakter.',
            'status.boolean'     => 'status harus berupa boolean.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(ProvinsiResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
