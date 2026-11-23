<?php

namespace App\Repositories;

use App\Http\Requests\MotorRequest;
use App\Models\Motor;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class MotorRepository
{
    public function findById(int|string $id): ?Motor
    {
        return Motor::find($id);
    }

    public function create(array $data): Motor
    {
        return Motor::create($data);
    }

    public function update(Motor $motor, array $data): Motor
    {
        $motor->update($data);
        return $motor->fresh();
    }

    public function delete(Motor $motor): bool
    {
        return (bool) $motor->delete();
    }

    public function index(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return $this->applySearch(Motor::query(), $search)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    private function applySearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where(function ($q) use ($search) {
            $q->where('item_code', 'ILIKE', "%{$search}%")
                ->orWhere('type_code', 'ILIKE', "%{$search}%")
                ->orWhere('type_description', 'ILIKE', "%{$search}%")
                ->orWhere('color_code', 'ILIKE', "%{$search}%")
                ->orWhere('color_description', 'ILIKE', "%{$search}%")
                ->orWhere('market_name', 'ILIKE', "%{$search}%")
                ->orWhere('class', 'ILIKE', "%{$search}%");
        }));
    }

    public function importFromExcel(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet   = $spreadsheet->getActiveSheet();
        $rows        = $worksheet->toArray(null, true, true, true);

        $header = array_shift($rows);
        $normalizedHeader = array_map(fn ($h) => strtolower(trim((string) $h)), $header);

        $expectedHeader = [
            'type_code',
            'type_description',
            'color_code',
            'color_description',
            'market_name',
            'class',
            'start_date',
            'end_date',
        ];
        $actualHeader = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, count($expectedHeader)) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus: ' . implode(', ', $expectedHeader)],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader);
        $messages  = (new MotorRequest())->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1;

                $typeCode         = strtoupper(trim((string) ($row[$columnMap['type_code']] ?? '')));
                $typeDescription  = trim((string) ($row[$columnMap['type_description']] ?? ''));
                $colorCode        = strtoupper(trim((string) ($row[$columnMap['color_code']] ?? '')));
                $colorDescription = trim((string) ($row[$columnMap['color_description']] ?? ''));
                $marketName       = trim((string) ($row[$columnMap['market_name']] ?? ''));
                $class            = trim((string) ($row[$columnMap['class']] ?? ''));
                $startDate        = trim((string) ($row[$columnMap['start_date']] ?? ''));
                $endDateRaw       = trim((string) ($row[$columnMap['end_date']] ?? ''));
                $endDate          = $endDateRaw === '' ? null : $endDateRaw;

                if ($typeCode === '' && $colorCode === '' && $marketName === '') {
                    continue;
                }

                $rowData = [
                    'type_code'         => $typeCode,
                    'type_description'  => $typeDescription,
                    'color_code'        => $colorCode,
                    'color_description' => $colorDescription,
                    'market_name'       => $marketName,
                    'class'             => $class,
                    'start_date'        => $startDate,
                    'end_date'          => $endDate,
                ];

                $rules = [
                    'type_code'         => ['required', 'string', 'max:15'],
                    'type_description'  => ['required', 'string', 'max:100'],
                    'color_code'        => [
                        'required',
                        'string',
                        'max:10',
                        Rule::unique(Motor::class, 'color_code')
                            ->where(fn ($q) => $q->where('type_code', $typeCode)),
                    ],
                    'color_description' => ['required', 'string', 'max:100'],
                    'market_name'       => ['required', 'string', 'max:150'],
                    'class'             => ['required', 'string', 'max:50'],
                    'start_date'        => ['required', 'date'],
                    'end_date'          => ['nullable', 'date', 'after_or_equal:start_date'],
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $motor = Motor::create($rowData);

                $imported[] = $motor;
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

    public function exportToExcel(?string $search = null): string
    {
        $motors = $this->applySearch(Motor::query(), $search)
            ->orderBy('item_code', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Motor');

        $headers = [
            'No',
            'item_code',
            'type_code',
            'type_description',
            'color_code',
            'color_description',
            'market_name',
            'class',
            'start_date',
            'end_date',
        ];
        $columns = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        foreach ($headers as $index => $headerTitle) {
            $col = $columns[$index];
            $sheet->setCellValue("{$col}1", $headerTitle);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        $rowNumber = 2;
        foreach ($motors as $i => $motor) {
            $sheet->setCellValue("A{$rowNumber}", $i + 1);
            $sheet->setCellValueExplicit("B{$rowNumber}", (string) $motor->item_code, DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("C{$rowNumber}", (string) $motor->type_code, DataType::TYPE_STRING);
            $sheet->setCellValue("D{$rowNumber}", $motor->type_description);
            $sheet->setCellValueExplicit("E{$rowNumber}", (string) $motor->color_code, DataType::TYPE_STRING);
            $sheet->setCellValue("F{$rowNumber}", $motor->color_description);
            $sheet->setCellValue("G{$rowNumber}", $motor->market_name);
            $sheet->setCellValue("H{$rowNumber}", $motor->class);
            $sheet->setCellValue("I{$rowNumber}", $motor->start_date?->format('Y-m-d'));
            $sheet->setCellValue("J{$rowNumber}", $motor->end_date?->format('Y-m-d'));
            $rowNumber++;
        }

        foreach ($columns as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);

        ob_start();
        $writer->save('php://output');
        return ob_get_clean();
    }

    /**
     * Import data motor dari file .UTC / text pemisah titik koma (;) dari AHM.
     */
    public function importFromUtc(string $filePath): array
    {
        $lines = file($filePath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        if ($lines === false || empty($lines)) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['File UTC kosong atau tidak dapat dibaca.'],
                'imported' => [],
            ];
        }

        $success  = 0;
        $created  = 0;
        $updated  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        DB::transaction(function () use ($lines, &$success, &$created, &$updated, &$failed, &$errors, &$imported) {
            foreach ($lines as $index => $line) {
                $lineNumber = $index + 1;
                $line = trim($line);
                if ($line === '') {
                    continue;
                }

                // Kolom dipisahkan oleh tanda titik-koma (;)
                $cols = explode(';', $line);

                if (count($cols) < 8) {
                    $failed++;
                    $errors[] = "Baris {$lineNumber}: Format kolom tidak lengkap (ditemukan " . count($cols) . " kolom).";
                    continue;
                }

                $itemCodeRaw     = trim($cols[0] ?? '');
                $typeCode        = strtoupper(trim($cols[1] ?? ''));
                $typeDescription = trim($cols[2] ?? '');
                $colorCode       = strtoupper(trim($cols[3] ?? ''));
                $colorDescription= trim($cols[4] ?? '');
                $marketName      = trim($cols[5] ?? '');
                // $cols[6] adalah kapasitas CC mesin -> diabaikan sesuai kolom database
                $class           = trim($cols[7] ?? '');
                $startDateRaw    = trim($cols[8] ?? '');
                $endDateRaw      = trim($cols[9] ?? '');

                if ($typeCode === '' || $colorCode === '') {
                    $failed++;
                    $errors[] = "Baris {$lineNumber}: Kode tipe dan kode warna wajib diisi.";
                    continue;
                }

                $startDate = $this->parseUtcDate($startDateRaw);
                if (!$startDate) {
                    $failed++;
                    $errors[] = "Baris {$lineNumber}: Format tanggal awal ('{$startDateRaw}') tidak valid.";
                    continue;
                }

                $endDate  = $this->parseUtcDate($endDateRaw);
                $itemCode = $itemCodeRaw !== '' ? strtoupper($itemCodeRaw) : "{$typeCode}-{$colorCode}";

                // Jika item_code sudah ada di database -> UPDATE data.
                // Jika item_code belum ada di database -> CREATE data baru.
                $motor = Motor::updateOrCreate(
                    [
                        'item_code' => $itemCode,
                    ],
                    [
                        'type_code'         => $typeCode,
                        'type_description'  => $typeDescription !== '' ? $typeDescription : $marketName,
                        'color_code'        => $colorCode,
                        'color_description' => $colorDescription,
                        'market_name'       => $marketName,
                        'class'             => $class,
                        'start_date'        => $startDate,
                        'end_date'          => $endDate,
                    ]
                );

                if ($motor->wasRecentlyCreated) {
                    $created++;
                } else {
                    $updated++;
                }

                $success++;
                $imported[] = [
                    'item_code'   => $motor->item_code,
                    'type_code'   => $motor->type_code,
                    'color_code'  => $motor->color_code,
                    'market_name' => $motor->market_name,
                    'aksi'        => $motor->wasRecentlyCreated ? 'ditambahkan' : 'diperbarui',
                ];
            }
        });

        return [
            'success'       => $success,
            'created_count' => $created,
            'updated_count' => $updated,
            'failed'        => $failed,
            'errors'        => $errors,
            'imported'      => $imported,
        ];
    }

    /**
     * Konversi tanggal dari format ddmmyyyy AHM (contoh: 13112026 -> 2026-11-13)
     */
    private function parseUtcDate(?string $raw): ?string
    {
        if (!$raw) {
            return null;
        }
        $raw = trim($raw);
        if ($raw === '' || $raw === '0' || $raw === '00000000') {
            return null;
        }

        // Format ddmmyyyy (8 digit)
        if (preg_match('/^(\d{2})(\d{2})(\d{4})$/', $raw, $m)) {
            $day   = (int) $m[1];
            $month = (int) $m[2];
            $year  = (int) $m[3];
            if (checkdate($month, $day, $year)) {
                return sprintf('%04d-%02d-%02d', $year, $month, $day);
            }
        }

        // Format YYYY-MM-DD
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
            return $raw;
        }

        try {
            return \Carbon\Carbon::parse($raw)->format('Y-m-d');
        } catch (\Throwable) {
            return null;
        }
    }
}