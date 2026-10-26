<?php

namespace App\Http\Requests;

use App\Http\Responses\UrlIpResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;

class UrlIpLoginRequest extends FormRequest
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
          'is_active' => 'required|boolean',
        ];
    }
    public function messages(): array
    {
        return [
            'url.required'   => 'URL wajib diisi.',
            'url.url'        => 'URL harus berupa URL yang valid.',
            'is_active.required'=> 'Status aktif wajib diisi.',
            'is_active.boolean' => 'Status aktif harus berupa boolean (true atau false).',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(UrlIpResponse::class)->validationError($validator->errors()->toArray())
        );
    }   
}
