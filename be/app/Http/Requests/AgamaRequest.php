<?php

namespace App\Http\Requests;

use App\Http\Responses\AgamaResponse;
use App\Models\Agama;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;


class AgamaRequest extends FormRequest
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
                Rule::unique(Agama::class, 'kode'),
            ],
            'name' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kode.required'      => 'Kode agama wajib diisi.',
            'kode.string'        => 'Kode agama harus berupa string.',
            'kode.digits_between' => 'Kode agama harus antara 1 sampai 10 digit.',
            'kode.unique'        => 'Kode agama sudah terdaftar.',
            'name.required'      => 'Nama agama wajib diisi.',
            'name.string'        => 'Nama agama harus berupa string.',
            'name.max'           => 'Nama agama tidak boleh lebih dari 255 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(AgamaResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
