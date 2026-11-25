<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReserveMotorUnitRequest extends FormRequest
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
}
