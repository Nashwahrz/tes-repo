<?php

namespace App\Http\Requests;

use App\Http\Responses\KonsumenResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class CheckNikRequest extends FormRequest
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
            'nik' => ['required', 'string', 'min:12', 'max:16'],
        ];
    }

    public function messages(): array
    {
        return [
            'nik.required' => 'Kata kunci pencarian wajib diisi.',
            'nik.string'   => 'Kata kunci pencarian harus berupa teks.',
            'nik.min'      => 'Ketik minimal 12 karakter untuk mencari.',
            'nik.max'      => 'Maksimal 16 karakter.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KonsumenResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
