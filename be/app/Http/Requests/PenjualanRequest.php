<?php

namespace App\Http\Requests;

use App\Enums\RoleEnum;
use App\Models\Dealer;
use App\Models\Konsumen;
use App\Models\MotorUnit;
use App\Models\Penjualan;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PenjualanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $user = $this->user();
        if ($user) {
            $roleName = $user->relationLoaded('role')
                ? $user->role?->role_name
                : $user->role()->value('role_name');

            if ($roleName !== RoleEnum::SuperAdmin->value && $user->fk_dealer) {
                $this->merge(['dealer_id' => $user->fk_dealer]);
            }
        }

        if ($this->has('metode_pembayaran')) {
            $this->merge([
                'metode_pembayaran' => strtoupper(trim((string) $this->input('metode_pembayaran'))),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'dealer_id'          => ['required', 'integer', Rule::exists(Dealer::class, 'id')],
            'konsumen_id'        => ['required', 'integer', Rule::exists(Konsumen::class, 'id')],
            'motor_unit_id'      => ['required', 'integer', Rule::exists(MotorUnit::class, 'id')],
            'tanggal_transaksi'  => ['nullable', 'date'],
            'metode_pembayaran'  => ['required', 'string', Rule::in([Penjualan::METODE_CASH, Penjualan::METODE_KREDIT])],
            'harga_otr'          => ['required', 'numeric', 'min:0'],
            'diskon'             => ['nullable', 'numeric', 'min:0'],
            'uang_muka'          => ['nullable', 'numeric', 'min:0'],
            'nama_leasing'       => ['required_if:metode_pembayaran,KREDIT', 'nullable', 'string', 'max:100'],
            'tenor_bulan'        => ['required_if:metode_pembayaran,KREDIT', 'nullable', 'integer', 'min:1'],
            'angsuran_per_bulan' => ['nullable', 'numeric', 'min:0'],
            'catatan'            => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'dealer_id.required'         => 'Dealer wajib dipilih.',
            'dealer_id.exists'           => 'Data dealer tidak ditemukan.',
            'konsumen_id.required'       => 'Konsumen wajib dipilih.',
            'konsumen_id.exists'         => 'Data konsumen tidak ditemukan.',
            'motor_unit_id.required'     => 'Unit motor wajib dipilih.',
            'motor_unit_id.exists'       => 'Unit fisik motor tidak ditemukan.',
            'tanggal_transaksi.date'     => 'Format tanggal transaksi tidak valid.',
            'metode_pembayaran.required' => 'Metode pembayaran wajib dipilih.',
            'metode_pembayaran.in'       => 'Metode pembayaran harus CASH atau KREDIT.',
            'harga_otr.required'         => 'Harga OTR wajib diisi.',
            'harga_otr.numeric'          => 'Harga OTR harus berupa angka.',
            'harga_otr.min'              => 'Harga OTR tidak boleh negatif.',
            'diskon.numeric'             => 'Diskon harus berupa angka.',
            'uang_muka.numeric'          => 'Uang muka (DP) harus berupa angka.',
            'nama_leasing.required_if'   => 'Nama leasing wajib diisi untuk pembelian kredit.',
            'tenor_bulan.required_if'    => 'Tenor (bulan) wajib diisi untuk pembelian kredit.',
            'tenor_bulan.integer'        => 'Tenor harus berupa angka bulat.',
            'catatan.max'                => 'Catatan maksimal 500 karakter.',
        ];
    }
}
