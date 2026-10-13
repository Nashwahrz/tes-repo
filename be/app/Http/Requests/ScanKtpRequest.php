<?php

namespace App\Http\Requests;

use App\Http\Responses\KonsumenResponse;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class ScanKtpRequest extends FormRequest
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
            "foto_ktp" => "required|image|mimes:jpg,jpeg,png|max:2048",
        ];
    }

    public function messages(): array
    {
        return [
            "foto_ktp.required" => "Foto KTP wajib diunggah",
            "foto_ktp.image" => "File harus berupa gambar",
            "foto_ktp.mimes" => "Format file harus JPG, JPEG, atau PNG",
            "foto_ktp.max" => "Ukuran file maksimal 2MB",
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(KonsumenResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
