<?php

namespace App\Http\Requests;

use App\Http\Responses\MotorResponse;
use App\Models\Motor;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class MotorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type_code'  => is_string($this->type_code) ? strtoupper(trim($this->type_code)) : $this->type_code,
            'color_code' => is_string($this->color_code) ? strtoupper(trim($this->color_code)) : $this->color_code,
        ]);
    }

    public function rules(): array
    {
        $id = $this->route('id');

        $colorRules = ['required', 'string', 'max:10'];

        // Saat update (PUT/PATCH), pastikan kombinasi tipe & warna tidak bertabrakan dengan ID motor lain
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $colorRules[] = Rule::unique(Motor::class, 'color_code')
                ->where(fn ($query) => $query->where('type_code', $this->type_code))
                ->ignore($id);
        }

        return [
            'type_code'         => ['required', 'string', 'max:15'],
            'type_description'  => ['required', 'string', 'max:100'],
            'color_code'        => $colorRules,
            'color_description' => ['required', 'string', 'max:100'],
            'market_name'       => ['required', 'string', 'max:150'],
            'class'             => ['required', 'string', 'max:50'],
            'start_date'        => ['required', 'date'],
            'end_date'          => ['nullable', 'date', 'after_or_equal:start_date'],
        ];
    }

    public function messages(): array
    {
        return [
            'type_code.required'          => 'Kode tipe wajib diisi.',
            'type_code.max'               => 'Kode tipe maksimal 15 karakter.',
            'type_description.required'   => 'Deskripsi tipe wajib diisi.',
            'type_description.max'        => 'Deskripsi tipe maksimal 100 karakter.',
            'color_code.required'         => 'Kode warna wajib diisi.',
            'color_code.max'              => 'Kode warna maksimal 10 karakter.',
            'color_code.unique'           => 'Kombinasi kode tipe dan kode warna ini sudah terdaftar.',
            'color_description.required'  => 'Deskripsi warna wajib diisi.',
            'color_description.max'       => 'Deskripsi warna maksimal 100 karakter.',
            'market_name.required'        => 'Nama pasar wajib diisi.',
            'market_name.max'             => 'Nama pasar maksimal 150 karakter.',
            'class.required'              => 'Kelas motor wajib diisi.',
            'class.max'                   => 'Kelas motor maksimal 50 karakter.',
            'start_date.required'         => 'Tanggal awal wajib diisi.',
            'start_date.date'             => 'Format tanggal awal tidak valid.',
            'end_date.date'               => 'Format tanggal akhir tidak valid.',
            'end_date.after_or_equal'     => 'Tanggal akhir tidak boleh mendahului tanggal awal.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(MotorResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
