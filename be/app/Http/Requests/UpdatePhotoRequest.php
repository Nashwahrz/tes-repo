<?php

namespace App\Http\Requests;

use App\Http\Responses\UserResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UpdatePhotoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => [
                'required',
                'file',
                'image',
                'mimes:jpeg,png,jpg,webp',
                'max:512', 
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'photo.required' => 'File foto wajib diunggah.',
            'photo.file'     => 'File yang diunggah tidak valid.',
            'photo.image'    => 'File harus berupa gambar.',
            'photo.mimes'    => 'Format gambar harus jpeg, png, jpg, atau webp.',
            'photo.max'      => 'Ukuran foto maksimal adalah 512kb.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(UserResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}

