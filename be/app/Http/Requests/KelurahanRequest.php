<?php

namespace App\Http\Requests;


use App\Http\Responses\KelurahanResponse;
use App\Models\Kecamatan;
use App\Models\Kelurahan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class KelurahanRequest extends FormRequest
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
               Rule::unique(Kelurahan::class, 'name'),
            ], 
            'id_kecamatan' => [
                'required',
                'integer',
               Rule::exists(Kecamatan::class, 'id'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Kelurahan wajib diisi.',
            'name.string'        => 'Kelurahan harus berupa string.',
            'name.max'           => 'Kelurahan tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'Kelurahan sudah terdaftar.',
            'id_kecamatan.required'      => 'Kecamatan wajib diisi.',
            'id_kecamatan.integer'        => 'Kecamatan harus berupa integer.',
            'id_kecamatan.exists'           => 'Kecamatan tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KelurahanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
