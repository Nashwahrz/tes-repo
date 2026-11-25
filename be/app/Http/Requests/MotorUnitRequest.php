<?php

namespace App\Http\Requests;

use App\Models\Dealer;
use App\Models\Motor;
use App\Models\MotorUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class MotorUnitRequest extends FormRequest
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
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $id       = $this->route('id') ?? $this->route('motor_unit');
        $reqRule  = $isUpdate ? ['sometimes', 'required'] : ['required'];

        return [
            'item_code'    => [...$reqRule, 'string', 'max:6', Rule::exists(Motor::class, 'item_code')],
            'dealer_id'    => [...$reqRule, 'integer', Rule::exists(Dealer::class, 'id')],
            'nomor_rangka' => [
                ...$reqRule,
                'string',
                'max:50',
                $isUpdate
                    ? Rule::unique('motor_units', 'nomor_rangka')->ignore($id)
                    : Rule::unique('motor_units', 'nomor_rangka'),
            ],
            'nomor_mesin'  => [
                ...$reqRule,
                'string',
                'max:50',
                $isUpdate
                    ? Rule::unique('motor_units', 'nomor_mesin')->ignore($id)
                    : Rule::unique('motor_units', 'nomor_mesin'),
            ],
            'status'       => [
                'sometimes',
                'required',
                'string',
                Rule::in([
                    MotorUnit::STATUS_AVAILABLE,
                    MotorUnit::STATUS_RESERVED,
                    MotorUnit::STATUS_SOLD,
                    MotorUnit::STATUS_IN_TRANSIT,
                    MotorUnit::STATUS_DAMAGED,
                ]),
            ],
            'catatan'      => ['nullable', 'string', 'max:500'],
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
            'status.in'             => 'Status unit tidak valid.',
            'catatan.max'           => 'Catatan maksimal 500 karakter.',
        ];
    }
}
