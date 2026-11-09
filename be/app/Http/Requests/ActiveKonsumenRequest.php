<?php

namespace App\Http\Requests;

use App\Enums\StatusKonsumen;
use App\Enums\StatusUser;
use App\Http\Responses\UserResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class ActiveKonsumenRequest extends FormRequest
{
   
    public function authorize(): bool
    {
        return true;
    }


    public function rules(): array
    {
        $isDiterima = $this->input('status') === StatusKonsumen::Diterima->value;

        return [
            'note' => $isDiterima
                ? ['nullable', 'string', 'max:255']
                : ['required', 'string', 'max:255'],
            'status'    => ['sometimes', Rule::enum(StatusKonsumen::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'note.required' => 'Catatan penolakan wajib diisi.',
            'note.string'   => 'Catatan penolakan harus berupa string.',
            'status.enum'        => 'Status yang dipilih tidak valid.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(UserResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
