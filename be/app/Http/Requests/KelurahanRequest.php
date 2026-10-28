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

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return [
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'kode_kecamatan' => [
                    'required',
                    'string',
                    Rule::exists(Kecamatan::class, 'kode'),
                ],
            ];
        }

        return [
            'kode' => [
                'required',
                'string',
                'digits_between:1,10',
               Rule::unique(Kelurahan::class, 'kode'),
            ],  
            'name' => [
                'required',
                'string',
                'max:255',
            ], 
            'kode_kecamatan' => [
                'required',
                'string',
               Rule::exists(Kecamatan::class, 'kode'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required'      => 'kode kelurahan wajib diisi.',
            'kode.string'        => 'kode kelurahan harus berupa string.',
            'kode.digits_between'=> 'kode kelurahan harus berupa angka.',
            'kode.unique'        => 'kode kelurahan sudah terdaftar.',
            'name.required'      => 'Kelurahan wajib diisi.',
            'name.string'        => 'Kelurahan harus berupa string.',
            'name.max'           => 'Kelurahan tidak boleh lebih dari 255 karakter.',
            'kode_kecamatan.required'      => 'Kecamatan wajib diisi.',
            'kode_kecamatan.integer'        => 'Kecamatan harus berupa integer.',
            'kode_kecamatan.exists'           => 'Kecamatan tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KelurahanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
