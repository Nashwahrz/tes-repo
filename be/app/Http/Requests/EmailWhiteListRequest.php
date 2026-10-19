<?php

namespace App\Http\Requests;

use App\Http\Responses\EmailWhiteListResponse;
use App\Models\EmailWhitelist;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class EmailWhiteListRequest extends FormRequest
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
            'domain' => ['required','string','starts_with:@',Rule::unique(EmailWhitelist::class, 'domain')],    
            'is_active' => 'required|boolean',
            'created_by' => 'required|exists:users,id',
        ];
    }
    public function messages(): array
    {
        return [
            'domain.required'   => 'Domain wajib diisi.',
            'domain.string'     => 'Domain harus berupa string.',
            'domain.unique'     => 'Domain sudah terdaftar.',
            'domain.starts_with' => 'Domain harus diawali dengan @, contoh: @gmail.com.',
            'is_active.required'=> 'Status aktif wajib diisi.',
            'is_active.boolean' => 'Status aktif harus berupa boolean.',
            'created_by.required'=> 'Dibuat oleh wajib diisi.',
            'created_by.exists'=> 'Dibuat oleh tidak ditemukan.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(EmailWhiteListResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
