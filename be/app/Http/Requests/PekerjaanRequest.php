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
        return [
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
            'name.required'      => 'Nama pekerjaan wajib diisi.',
            'name.string'        => 'Nama pekerjaan harus berupa string.',
            'name.max'           => 'Nama pekerjaan tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'Nama pekerjaan sudah terdaftar.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(PekerjaanResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
