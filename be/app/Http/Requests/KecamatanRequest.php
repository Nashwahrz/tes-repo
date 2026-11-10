<?php

namespace App\Http\Requests;


use App\Http\Responses\KecamatanResponse;
use App\Models\KabupatenKota;
use App\Models\Kecamatan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class KecamatanRequest extends FormRequest
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
                'kecamatan_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'fk_kabupaten_kota' => [
                    'required',
                    'string',
                    Rule::exists(KabupatenKota::class, 'kabupaten_kota_code'),
                ],
                'status' => [
                    'sometimes',
                    'boolean',
                ]
            ];
        }

        return [
            "kecamatan_code"=> [
                'required',
                'string',
                'size:6',
            ],
            'kecamatan_name' => [
                'required',
                'string',
                'max:255',
            ], 
            'fk_kabupaten_kota' => [
                'required',
                'string',
               Rule::exists(KabupatenKota::class, 'kabupaten_kota_code'),
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
            'kecamatan_code.required'      => 'kode kecamatan wajib diisi.',
            'kecamatan_code.string'        => 'kode kecamatan harus berupa string.',
            'kecamatan_code.size'          => 'kode kecamatan harus terdiri dari 6 digit.',
            'kecamatan_name.required'      => 'Kecamatan wajib diisi.',
            'kecamatan_name.string'        => 'Kecamatan harus berupa string.',
            'kecamatan_name.max'           => 'Kecamatan tidak boleh lebih dari 255 karakter.',
            'fk_kabupaten_kota.required'      => 'Kabupaten/Kota wajib diisi.',
            'fk_kabupaten_kota.string'        => 'Kabupaten/Kota harus berupa string.',
            'fk_kabupaten_kota.exists'           => 'Kabupaten/Kota tidak ditemukan.',
            'status.boolean'        => 'Status harus berupa boolean.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KecamatanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
