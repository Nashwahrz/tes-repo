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
            'id_dealer' => $isDitolak
                ? ['nullable', 'integer', Rule::exists(Dealer::class, 'id')]
                : ['required', 'integer', Rule::exists(Dealer::class, 'id')],
            'id_atasan' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'status'    => ['sometimes', Rule::enum(StatusUser::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'id_dealer.required' => 'ID dealer wajib diisi.',
            'id_dealer.integer'  => 'ID dealer harus berupa angka.',
            'id_dealer.exists'   => 'Dealer tidak ditemukan.',
            'id_atasan.integer'  => 'ID atasan harus berupa angka.',
            'id_atasan.exists'   => 'Atasan tidak ditemukan.',
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
