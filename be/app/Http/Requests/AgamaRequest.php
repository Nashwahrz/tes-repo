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
                'agama_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
            ];
        }

        return [
            'agama_code' => [
                'required',
                'string',
                'size:3',
                Rule::unique(Agama::class, 'agama_code'),
            ],
            'agama_name' => [
                'required',
                'string',
                'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'agama_code.required'      => 'Kode agama wajib diisi.',
            'agama_code.string'        => 'Kode agama harus berupa string.',
            'agama_code.size'         => 'Kode agama harus terdiri dari 3 digit.',
            'agama_code.unique'        => 'Kode agama sudah terdaftar.',
            'agama_name.required'      => 'Nama agama wajib diisi.',
            'agama_name.string'        => 'Nama agama harus berupa string.',
            'agama_name.max'           => 'Nama agama tidak boleh lebih dari 255 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(AgamaResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
