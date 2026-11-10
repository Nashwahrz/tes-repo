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
                'kelurahan_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'fk_kecamatan' => [
                    'required',
                    'string',
                    Rule::exists(Kecamatan::class, 'kecamatan_code'),
                ],
            ];
        }

        return [
            'kelurahan_code' => [
                'required',
                'string',
                'size:10',
               Rule::unique(Kelurahan::class, 'kelurahan_code'),
            ],  
            'kelurahan_name' => [
                'required',
                'string',
                'max:255',
            ], 
            'fk_kecamatan' => [
                'required',
                'string',
               Rule::exists(Kecamatan::class, 'kecamatan_code'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kelurahan_code.required'      => 'kode kelurahan wajib diisi.',
            'kelurahan_code.string'        => 'kode kelurahan harus berupa string.',
            'kelurahan_code.size'          => 'kode kelurahan harus terdiri dari 10 digit.',
            'kelurahan_code.unique'        => 'kode kelurahan sudah terdaftar.',
            'kelurahan_name.required'      => 'Kelurahan wajib diisi.',
            'kelurahan_name.string'        => 'Kelurahan harus berupa string.',
            'kelurahan_name.max'           => 'Kelurahan tidak boleh lebih dari 255 karakter.',
            'fk_kecamatan.required'      => 'Kecamatan wajib diisi.',
            'fk_kecamatan.integer'        => 'Kecamatan harus berupa integer.',
            'fk_kecamatan.exists'           => 'Kecamatan tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KelurahanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
