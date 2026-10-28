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
                'name' => [
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
            'kode' => [
                'required',
                'string',
                'digits_between:1,10',
                Rule::unique(Provinsi::class, 'kode'),
            ],
            'name' => [
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
            'kode.required'      => 'kode provinsi wajib diisi.',
            'kode.string'        => 'kode provinsi harus berupa string.',
            'kode.digits_between'=> 'kode provinsi harus berupa angka.',
            'kode.unique'        => 'kode provinsi sudah terdaftar.',
            'name.required'      => 'provinsi wajib diisi.',
            'name.string'        => 'provinsi harus berupa string.',
            'name.max'           => 'provinsi tidak boleh lebih dari 255 karakter.',
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
