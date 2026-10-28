<?php

namespace App\Http\Requests;

use App\Http\Responses\PekerjaanResponse;
use App\Models\Pekerjaan;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class PekerjaanRequest extends FormRequest
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
            ];
        }

        return [
            'kode' => [
                'required',
                'string',
                'digits_between:1,10',
                Rule::unique(Pekerjaan::class, 'kode'),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
               Rule::unique(Pekerjaan::class, 'name'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required'      => 'Kode pekerjaan wajib diisi.',
            'kode.string'        => 'Kode pekerjaan harus berupa string.',
            'kode.digits_between' => 'Kode pekerjaan harus antara 1 sampai 10 digit.',
            'kode.unique'        => 'Kode pekerjaan sudah terdaftar.',
            'name.required'      => 'Nama pekerjaan wajib diisi.',
            'name.string'        => 'Nama pekerjaan harus berupa string.',
            'name.max'           => 'Nama pekerjaan tidak boleh lebih dari 255 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(PekerjaanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
