<?php

namespace App\Http\Requests;

use App\Http\Responses\AppKeyOcrResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class AppKeyOcrRequest extends FormRequest
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
          'url' => 'required|url',
          'api_key' => 'required',
          'is_active' => 'required|boolean',
          'keterangan' => 'required',
        ];
    }

    public function messages(): array
    {
        return [
          'url.required' => 'url harus diisi',
          'url.url' => 'url harus berupa url',
          'api_key.required' => 'api_key harus diisi',
          'is_active.required' => 'is_active harus diisi',
          'is_active.boolean' => 'is_active harus berupa boolean',
          'keterangan.required' => 'keterangan harus diisi',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(AppKeyOcrResponse::class)->validationError($validator->errors()->toArray())
        );
    }  
}
