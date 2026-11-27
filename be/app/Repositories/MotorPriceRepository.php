<?php

namespace App\Repositories;

use App\Models\Motor;
use App\Models\MotorPrice;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\IOFactory;

class MotorPriceRepository
{
    public function index(
        int $perPage = 10,
        ?string $search = null,
        ?int $tahunProduksi = null,
        ?string $itemCode = null,
        ?bool $status = null
    ): LengthAwarePaginator {
        $query = MotorPrice::query()
            ->with('motor:id,item_code,type_code,type_description,color_code,color_description,market_name,class');

        if ($tahunProduksi !== null && $tahunProduksi > 0) {
            $query->where('tahun_produksi', $tahunProduksi);
        }

        if ($itemCode !== null && trim($itemCode) !== '') {
            $query->where('item_code', strtoupper(trim($itemCode)));
        }

        if ($status !== null) {
            $query->where('status', $status);
        }

        if ($search !== null && trim($search) !== '') {
            $term = trim($search);
            $query->where(function ($q) use ($term) {
                $q->where('item_code', 'ILIKE', "%{$term}%")
                    ->orWhereHas('motor', function ($mq) use ($term) {
                        $mq->where('market_name', 'ILIKE', "%{$term}%")
                            ->orWhere('type_code', 'ILIKE', "%{$term}%")
                            ->orWhere('color_description', 'ILIKE', "%{$term}%");
                    });
            });
        }

        return $query->orderByDesc('tahun_produksi')->orderBy('item_code')->paginate($perPage)->withQueryString();
    }

    public function findById(int|string $id): ?MotorPrice
    {
        return MotorPrice::query()->with('motor')->find($id);
    }

    public function findByItemAndYear(string $itemCode, int $tahunProduksi): ?MotorPrice
    {
        return MotorPrice::query()
            ->where('item_code', strtoupper(trim($itemCode)))
            ->where('tahun_produksi', $tahunProduksi)
            ->where('status', true)
            ->first();
    }

    public function create(array $data): MotorPrice
    {
        return MotorPrice::create($data);
    }

    public function update(MotorPrice $motorPrice, array $data): MotorPrice
    {
        $motorPrice->update($data);
        return $motorPrice->fresh('motor');
    }

    public function delete(MotorPrice $motorPrice): bool
    {
        return (bool) $motorPrice->delete();
    }

    /**
     * Import data master harga motor dari file Excel (.xlsx/.xls) dengan validasi header dan isi field.
     */
    public function importFromExcel(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet   = $spreadsheet->getActiveSheet();
        $rows        = $worksheet->toArray(null, true, true, true);

        if (empty($rows)) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['File Excel kosong.'],
                'imported' => [],
            ];
        }

        $header           = array_shift($rows);
        $normalizedHeader = array_map(fn ($h) => strtolower(trim((string) $h)), $header);
        $expectedHeader   = ['item_code', 'tahun_produksi', 'harga_kosong', 'bbn_tnkb_hitam', 'bbn_tnkb_merah'];
        $actualHeader     = array_values(array_filter($normalizedHeader, fn ($h) => $h !== ''));

        if (array_slice($actualHeader, 0, count($expectedHeader)) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus: ' . implode(', ', $expectedHeader) . ' (opsional: status)'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader);

        $rules = [
            'item_code'      => ['required', 'string', 'max:6', Rule::exists(Motor::class, 'item_code')],
            'tahun_produksi' => ['required', 'integer', 'min:2000', 'max:2100'],
            'harga_kosong'   => ['required', 'numeric', 'min:0'],
            'bbn_tnkb_hitam' => ['required', 'numeric', 'min:0'],
            'bbn_tnkb_merah' => ['required', 'numeric', 'min:0'],
            'status'         => ['required', 'boolean'],
        ];

        $messages = [
            'item_code.required'      => 'Kode item motor wajib diisi.',
            'item_code.max'           => 'Kode item motor maksimal 6 karakter.',
            'item_code.exists'        => 'Kode item motor tidak ditemukan di master motor.',
            'tahun_produksi.required' => 'Tahun produksi wajib diisi.',
            'tahun_produksi.integer'  => 'Tahun produksi harus berupa angka tahun.',
            'tahun_produksi.min'      => 'Tahun produksi minimal tahun 2000.',
            'tahun_produksi.max'      => 'Tahun produksi maksimal tahun 2100.',
            'harga_kosong.required'   => 'Harga kosong wajib diisi.',
            'harga_kosong.numeric'    => 'Harga kosong harus berupa angka.',
            'harga_kosong.min'        => 'Harga kosong tidak boleh negatif.',
            'bbn_tnkb_hitam.required' => 'BBN TNKB Hitam wajib diisi.',
            'bbn_tnkb_hitam.numeric'  => 'BBN TNKB Hitam harus berupa angka.',
            'bbn_tnkb_hitam.min'      => 'BBN TNKB Hitam tidak boleh negatif.',
            'bbn_tnkb_merah.required' => 'BBN TNKB Merah wajib diisi.',
            'bbn_tnkb_merah.numeric'  => 'BBN TNKB Merah harus berupa angka.',
            'bbn_tnkb_merah.min'      => 'BBN TNKB Merah tidak boleh negatif.',
        ];

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1;

                $itemCode       = strtoupper(trim((string) ($row[$columnMap['item_code']] ?? '')));
                $tahunProduksi  = trim((string) ($row[$columnMap['tahun_produksi']] ?? ''));
                $hargaKosong    = $this->cleanNumber($row[$columnMap['harga_kosong']] ?? '');
                $bbnTnkbHitam   = $this->cleanNumber($row[$columnMap['bbn_tnkb_hitam']] ?? '');
                $bbnTnkbMerah   = $this->cleanNumber($row[$columnMap['bbn_tnkb_merah']] ?? '');
                $statusRaw      = isset($columnMap['status']) ? trim((string) ($row[$columnMap['status']] ?? '')) : '';

                if ($itemCode === '' && $tahunProduksi === '' && $hargaKosong === '' && $bbnTnkbHitam === '' && $bbnTnkbMerah === '') {
                    continue;
                }

                $statusBool = true;
                if ($statusRaw !== '') {
                    $lower = strtolower($statusRaw);
                    if (in_array($lower, ['aktif', '1', 'true'], true)) {
                        $statusBool = true;
                    } elseif (in_array($lower, ['non-aktif', 'nonaktif', '0', 'false'], true)) {
                        $statusBool = false;
                    } else {
                        $failed++;
                        $errors[] = "Baris {$rowNumber}: Status ('{$statusRaw}') tidak valid, harus Aktif atau Non-Aktif.";
                        continue;
                    }
                }

                $rowData = [
                    'item_code'      => $itemCode,
                    'tahun_produksi' => is_numeric($tahunProduksi) ? (int) $tahunProduksi : $tahunProduksi,
                    'harga_kosong'   => $hargaKosong,
                    'bbn_tnkb_hitam' => $bbnTnkbHitam,
                    'bbn_tnkb_merah' => $bbnTnkbMerah,
                    'status'         => $statusBool,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $price = MotorPrice::updateOrCreate(
                    [
                        'item_code'      => $itemCode,
                        'tahun_produksi' => (int) $tahunProduksi,
                    ],
                    [
                        'harga_kosong'   => (float) $hargaKosong,
                        'bbn_tnkb_hitam' => (float) $bbnTnkbHitam,
                        'bbn_tnkb_merah' => (float) $bbnTnkbMerah,
                        'status'         => $statusBool,
                    ]
                );

                $imported[] = $price->load('motor:id,item_code,market_name');
                $success++;
            }

            return [
                'success'  => $success,
                'failed'   => $failed,
                'errors'   => $errors,
                'imported' => $imported,
            ];
        });
    }

    private function cleanNumber(mixed $val): string|float|int
    {
        if (is_int($val) || is_float($val)) {
            return $val;
        }

        $str = trim((string) $val);
        if ($str === '') {
            return '';
        }

        // Hapus karakter non-angka kecuali titik/koma desimal jika ada format Rp
        $cleaned = preg_replace('/[^0-9.-]/', '', str_replace(',', '', $str));
        return $cleaned ?? '';
    }
}
