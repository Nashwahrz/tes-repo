<?php

namespace App\Http\Requests;

use App\Models\Dealer;
use App\Models\Motor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMotorUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('item_code')) {
            $this->merge([
                'item_code' => strtoupper(trim((string) $this->input('item_code'))),
            ]);
        }
        if ($this->has('nomor_rangka')) {
            $this->merge([
                'nomor_rangka' => strtoupper(trim((string) $this->input('nomor_rangka'))),
            ]);
        }
        if ($this->has('nomor_mesin')) {
            $this->merge([
                'nomor_mesin' => strtoupper(trim((string) $this->input('nomor_mesin'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'item_code'      => ['required', 'string', 'max:6', Rule::exists(Motor::class, 'item_code')],
            'dealer_id'      => ['required', 'integer', Rule::exists(Dealer::class, 'id')],
            'nomor_rangka'   => ['required', 'string', 'max:50', 'unique:motor_units,nomor_rangka'],
            'nomor_mesin'    => ['required', 'string', 'max:50', 'unique:motor_units,nomor_mesin'],
            'catatan'        => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'item_code.required'    => 'Kode item motor wajib diisi.',
            'item_code.max'         => 'Kode item motor maksimal 6 karakter.',
            'item_code.exists'      => 'Kode item motor tidak ditemukan di master motor.',
            'dealer_id.required'    => 'Dealer wajib dipilih.',
            'dealer_id.exists'      => 'Data dealer tidak ditemukan.',
            'nomor_rangka.required' => 'Nomor rangka wajib diisi.',
            'nomor_rangka.max'      => 'Nomor rangka maksimal 50 karakter.',
            'nomor_rangka.unique'   => 'Nomor rangka sudah terdaftar pada unit lain.',
            'nomor_mesin.required'  => 'Nomor mesin wajib diisi.',
            'nomor_mesin.max'       => 'Nomor mesin maksimal 50 karakter.',
            'nomor_mesin.unique'    => 'Nomor mesin sudah terdaftar pada unit lain.',
            'catatan.max'           => 'Catatan maksimal 500 karakter.',
        ];
    }
}
