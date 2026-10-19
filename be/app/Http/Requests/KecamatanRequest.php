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
        return [
            'name' => [
                'required',
                'string',
                'max:255',
               Rule::unique(Kecamatan::class, 'name'),
            ], 
            'id_kabupaten_kota' => [
                'required',
                'integer',
               Rule::exists(KabupatenKota::class, 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Kecamatan wajib diisi.',
            'name.string'        => 'Kecamatan harus berupa string.',
            'name.max'           => 'Kecamatan tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'Kecamatan sudah terdaftar.',
            'id_kabupaten_kota.required'      => 'Kabupaten/Kota wajib diisi.',
            'id_kabupaten_kota.integer'        => 'Kabupaten/Kota harus berupa integer.',
            'id_kabupaten_kota.exists'           => 'Kabupaten/Kota tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KecamatanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
