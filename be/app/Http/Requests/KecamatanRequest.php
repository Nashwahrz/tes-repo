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
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'kode_kabupaten_kota' => [
                    'required',
                    'string',
                    Rule::exists(KabupatenKota::class, 'kode'),
                ],
                'status' => [
                    'sometimes',
                    'boolean',
                ]
            ];
        }

        return [
            "kode"=> [
                'required',
                'string',
                'digits_between:1,10',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ], 
            'kode_kabupaten_kota' => [
                'required',
                'string',
               Rule::exists(KabupatenKota::class, 'kode'),
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
            'kode.required'      => 'kode kecamatan wajib diisi.',
            'kode.string'        => 'kode kecamatan harus berupa string.',
            'kode.digits_between'=> 'kode kecamatan harus berupa angka.',
            'name.required'      => 'Kecamatan wajib diisi.',
            'name.string'        => 'Kecamatan harus berupa string.',
            'name.max'           => 'Kecamatan tidak boleh lebih dari 255 karakter.',
            'kode_kabupaten_kota.required'      => 'Kabupaten/Kota wajib diisi.',
            'kode_kabupaten_kota.string'        => 'Kabupaten/Kota harus berupa string.',
            'kode_kabupaten_kota.exists'           => 'Kabupaten/Kota tidak ditemukan.',
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
