<?php

namespace App\Http\Requests;

use App\Models\MotorUnit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMotorUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('id') ?? $this->route('motor_unit');

        return [
            'nomor_rangka' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('motor_units', 'nomor_rangka')->ignore($id),
            ],
            'nomor_mesin' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('motor_units', 'nomor_mesin')->ignore($id),
            ],
            'status' => [
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
            'catatan' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
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
