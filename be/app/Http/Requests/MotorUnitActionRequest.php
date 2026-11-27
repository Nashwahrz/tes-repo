<?php

namespace App\Http\Requests;

use App\Http\Responses\MotorUnitResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class MotorUnitActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'dikunci_sampai' => ['nullable', 'date'],
            'catatan'        => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'dikunci_sampai.date' => 'Format batas waktu kunci tidak valid.',
            'catatan.max'         => 'Catatan maksimal 500 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(MotorUnitResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
