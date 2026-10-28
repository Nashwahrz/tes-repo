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
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'kode_provinsi' => [
                    'required',
                    'string',
                    Rule::exists(Provinsi::class, 'kode'),
                ],
            ];
        }

        return [
            'kode' => [
                'required',
                'string',
                'digits_between:1,10',
                Rule::unique(KabupatenKota::class, 'kode'),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ], 
            'kode_provinsi' => [
                'required',
                'string',
               Rule::exists(Provinsi::class, 'kode'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required'      => 'kode kabupaten/kota wajib diisi.',
            'kode.string'        => 'kode kabupaten/kota harus berupa string.',
            'kode.digits_between'=> 'kode kabupaten/kota harus berupa angka.',
            'kode.unique'        => 'kode kabupaten/kota sudah terdaftar.',
            'name.required'      => 'Kabupaten/Kota wajib diisi.',
            'name.string'        => 'Kabupaten/Kota harus berupa string.',
            'name.max'           => 'Kabupaten/Kota tidak boleh lebih dari 255 karakter.',
            'kode_provinsi.required'      => 'Provinsi wajib diisi.',
            'kode_provinsi.string'        => 'Provinsi harus berupa string.',
            'kode_provinsi.exists'           => 'Provinsi tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KabupatenKotaResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
