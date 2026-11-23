<?php

namespace App\Http\Requests;

use App\Http\Responses\ImportResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class ImportMotorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'file' => [
                'required',
                'file',
                'extensions:utc,txt,csv,xlsx,xls',
                'max:500',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'file.required'   => 'Berkas file wajib diunggah.',
            'file.file'       => 'Yang diunggah harus berupa berkas file.',
            'file.extensions' => 'Format berkas harus .utc, .txt, .csv, .xlsx, atau .xls.',
            'file.max'        => 'Ukuran berkas maksimal 500KB.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(ImportResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
