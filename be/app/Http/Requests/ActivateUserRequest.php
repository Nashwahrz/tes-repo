<?php

namespace App\Http\Requests;

use App\Enums\StatusUser;
use App\Http\Responses\UserResponse;
use App\Models\Dealer;
use App\Models\User;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class ActivateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }
    public function rules(): array
    {
        $isDitolak = $this->input('status') === StatusUser::Ditolak->value;

        return [
            'fk_dealer' => $isDitolak
                ? ['nullable', 'integer', Rule::exists(Dealer::class, 'id')]
                : ['required', 'integer', Rule::exists(Dealer::class, 'id')],
            'fk_atasan' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'status'    => ['sometimes', Rule::enum(StatusUser::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'fk_dealer.required' => 'ID dealer wajib diisi.',
            'fk_dealer.integer'  => 'ID dealer harus berupa angka.',
            'fk_dealer.exists'   => 'Dealer tidak ditemukan.',
            'fk_atasan.integer'  => 'ID atasan harus berupa angka.',
            'fk_atasan.exists'   => 'Atasan tidak ditemukan.',
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
