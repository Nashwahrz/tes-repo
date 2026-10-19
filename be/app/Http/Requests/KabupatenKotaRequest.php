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
        return [
            'name' => [
                'required',
                'string',
                'max:255',
               Rule::unique(KabupatenKota::class, 'name'),
            ], 
            'id_provinsi' => [
                'required',
                'integer',
               Rule::exists(Provinsi::class, 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Kabupaten/Kota wajib diisi.',
            'name.string'        => 'Kabupaten/Kota harus berupa string.',
            'name.max'           => 'Kabupaten/Kota tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'Kabupaten/Kota sudah terdaftar.',
            'id_provinsi.required'      => 'Provinsi wajib diisi.',
            'id_provinsi.integer'        => 'Provinsi harus berupa integer.',
            'id_provinsi.exists'           => 'Provinsi tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KabupatenKotaResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
