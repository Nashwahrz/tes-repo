<?php

namespace App\Http\Requests;

use App\Http\Responses\KabupatenKotaResponse;
use App\Models\KabupatenKota;
use App\Models\Provinsi;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class KabupatenKotaRequest extends FormRequest
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
                'kabupaten_kota_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'fk_provinsi' => [
                    'required',
                    'string',
                    Rule::exists(Provinsi::class, 'provinsi_code'),
                ],
            ];
        }

        return [
            'kabupaten_kota_code' => [
                'required',
                'string',
                'size:4',
                Rule::unique(KabupatenKota::class, 'kabupaten_kota_code'),
            ],
            'kabupaten_kota_name' => [
                'required',
                'string',
                'max:255',
            ], 
            'fk_provinsi' => [
                'required',
                'string',
               Rule::exists(Provinsi::class, 'provinsi_code'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kabupaten_kota_code.required'      => 'kode kabupaten/kota wajib diisi.',
            'kabupaten_kota_code.string'        => 'kode kabupaten/kota harus berupa string.',
            'kabupaten_kota_code.size'          => 'kode kabupaten/kota harus terdiri dari 4 digit.',
            'kabupaten_kota_code.unique'        => 'kode kabupaten/kota sudah terdaftar.',
            'kabupaten_kota_name.required'      => 'Kabupaten/Kota wajib diisi.',
            'kabupaten_kota_name.string'        => 'Kabupaten/Kota harus berupa string.',
            'kabupaten_kota_name.max'           => 'Kabupaten/Kota tidak boleh lebih dari 255 karakter.',
            'fk_provinsi.required'      => 'Provinsi wajib diisi.',
            'fk_provinsi.string'        => 'Provinsi harus berupa string.',
            'fk_provinsi.exists'           => 'Provinsi tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KabupatenKotaResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
