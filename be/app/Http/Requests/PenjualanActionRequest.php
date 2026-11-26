<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PenjualanActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'alasan_batal' => ['nullable', 'string', 'max:500'],
            'catatan'      => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'alasan_batal.max' => 'Alasan pembatalan maksimal 500 karakter.',
            'catatan.max'      => 'Catatan maksimal 500 karakter.',
        ];
    }
}
