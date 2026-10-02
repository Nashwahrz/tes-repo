<?php

namespace App\Http\Requests;

use App\Http\Responses\DealerResponse;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class DealerRequest extends FormRequest
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
        $dealer = $this->route('dealer');
        $dealerId = is_object($dealer) ? $dealer->id : $dealer;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('dealers', 'name')->ignore($dealerId),
            ],
            'alamat'    => ['required', 'string'],
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'      => 'Nama dealer wajib diisi.',
            'name.string'        => 'Nama dealer harus berupa string.',
            'name.max'           => 'Nama dealer tidak boleh lebih dari 255 karakter.',
            'name.unique'        => 'Nama dealer sudah terdaftar.',
            'alamat.required'    => 'Alamat wajib diisi.',
            'alamat.string'      => 'Alamat harus berupa string.',
            'latitude.required'  => 'Latitude wajib diisi.',
            'latitude.numeric'   => 'Latitude harus berupa angka.',
            'latitude.between'   => 'Latitude harus bernilai antara -90 dan 90.',
            'longitude.required' => 'Longitude wajib diisi.',
            'longitude.numeric'  => 'Longitude harus berupa angka.',
            'longitude.between'  => 'Longitude harus bernilai antara -180 dan 180.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(DealerResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
