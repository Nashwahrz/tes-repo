<?php

namespace App\Http\Requests;

use App\Http\Responses\MotorPriceResponse;
use App\Models\Motor;
use App\Models\MotorPrice;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Validation\Rule;

class MotorPriceRequest extends FormRequest
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

        if ($this->has('status')) {
            $raw = strtolower(trim((string) $this->input('status')));
            if (in_array($raw, ['aktif', '1', 'true'], true)) {
                $this->merge(['status' => true]);
            } elseif (in_array($raw, ['non-aktif', 'nonaktif', '0', 'false'], true)) {
                $this->merge(['status' => false]);
            }
        }
    }

    public function rules(): array
    {
        $isUpdate = $this->isMethod('put') || $this->isMethod('patch');
        $id       = $this->route('id') ?? $this->route('motor_price');
        $reqRule  = $isUpdate ? ['sometimes', 'required'] : ['required'];
        $itemCode = $this->input('item_code');

        if ($isUpdate && !$itemCode && $id) {
            $itemCode = MotorPrice::where('id', $id)->value('item_code');
        }

        return [
            'item_code'      => [...$reqRule, 'string', 'max:6', Rule::exists(Motor::class, 'item_code')],
            'tahun_produksi' => [
                ...$reqRule,
                'integer',
                'min:2000',
                'max:2100',
                Rule::unique(MotorPrice::class, 'tahun_produksi')
                    ->where(fn ($q) => $q->where('item_code', $itemCode))
                    ->ignore($id),
            ],
            'harga_kosong'   => [...$reqRule, 'numeric', 'min:0'],
            'bbn_tnkb_hitam' => [...$reqRule, 'numeric', 'min:0'],
            'bbn_tnkb_merah' => [...$reqRule, 'numeric', 'min:0'],
            'status'         => ['sometimes', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'item_code.required'      => 'Kode item motor wajib diisi.',
            'item_code.max'           => 'Kode item motor maksimal 6 karakter.',
            'item_code.exists'        => 'Kode item motor tidak ditemukan di master motor.',
            'tahun_produksi.required' => 'Tahun produksi wajib diisi.',
            'tahun_produksi.integer'  => 'Tahun produksi harus berupa angka tahun.',
            'tahun_produksi.min'      => 'Tahun produksi minimal tahun 2000.',
            'tahun_produksi.max'      => 'Tahun produksi maksimal tahun 2100.',
            'tahun_produksi.unique'   => 'Master harga untuk kode item dan tahun produksi ini sudah terdaftar.',
            'harga_kosong.required'   => 'Harga kosong (tanpa BBN) wajib diisi.',
            'harga_kosong.numeric'    => 'Harga kosong harus berupa angka.',
            'harga_kosong.min'        => 'Harga kosong tidak boleh negatif.',
            'bbn_tnkb_hitam.required' => 'Biaya BBN TNKB Hitam wajib diisi.',
            'bbn_tnkb_hitam.numeric'  => 'Biaya BBN TNKB Hitam harus berupa angka.',
            'bbn_tnkb_hitam.min'      => 'Biaya BBN TNKB Hitam tidak boleh negatif.',
            'bbn_tnkb_merah.required' => 'Biaya BBN TNKB Merah wajib diisi.',
            'bbn_tnkb_merah.numeric'  => 'Biaya BBN TNKB Merah harus berupa angka.',
            'bbn_tnkb_merah.min'      => 'Biaya BBN TNKB Merah tidak boleh negatif.',
            'status.boolean'          => 'Status harus berupa Aktif atau Non-Aktif.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(
            app(MotorPriceResponse::class)->validationError($validator->errors()->toArray())
        );
    }
}
