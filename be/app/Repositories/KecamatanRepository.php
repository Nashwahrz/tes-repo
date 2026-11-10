<?php

namespace App\Repositories;

use App\Http\Requests\KecamatanRequest;
use App\Models\Kecamatan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class KecamatanRepository
{
   
    public function findById(int $id): ?Kecamatan
    {
        return Kecamatan::find($id);
    }

   
    public function create(array $data): Kecamatan
    {
        return Kecamatan::create($data);
    }

    
    public function update(Kecamatan $kecamatan, array $data): Kecamatan
    {
        $kecamatan->update($data);
        return $kecamatan->fresh();
    }

  
    public function delete(Kecamatan $kecamatan): bool
    {
        return (bool) $kecamatan->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Kecamatan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kecamatan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kecamatan_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Kecamatan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kecamatan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kecamatan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Kecamatan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kecamatan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kecamatan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Kecamatan::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Kecamatan::class], function ($q) use ($search) {
                            $q->where('kecamatan_name', 'ILIKE', "%{$search}%")
                            ->orWhere('kecamatan_code', 'ILIKE', "%{$search}%");
                        });
                    })
            ->latest()
            ->paginate($perPage);

      
        return $logs;
    }
    public function importFromExcel(string $filePath): array
    {
        $spreadsheet = IOFactory::load($filePath);
        $worksheet   = $spreadsheet->getActiveSheet();
        $rows        = $worksheet->toArray(null, true, true, true);

        $header = array_shift($rows);
        $normalizedHeader = array_map(fn ($h) => strtolower(trim((string) $h)), $header);

        $expectedHeader = ['kecamatan_code', 'kecamatan_name','kecamatan_code'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 3) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : kecamatan_code, kecamatan_name,kecamatan_code'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new KecamatanRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $KecamatanCode = isset($columnMap['kecamatan_code']) ? trim((string) ($row[$columnMap['kecamatan_code']] ?? '')) : '';
                $KecamatanName = isset($columnMap['kecamatan_name']) ? trim((string) ($row[$columnMap['kecamatan_name']] ?? '')) : '';
                $kecamatanCode = isset($columnMap['kecamatan_code']) ? trim((string) ($row[$columnMap['kecamatan_code']] ?? '')) : '';

                if ($KecamatanCode === '' && $KecamatanName === '') {
                    continue;
                }

                $rowData = [
                    'kecamatan_code' => $KecamatanCode,
                    'kecamatan_name' => $KecamatanName,
                    'fk_kecamatan'         => $kecamatanCode,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $kecamatan = Kecamatan::create([
                    'kecamatan_code' => $KecamatanCode,
                    'kecamatan_name' => $KecamatanName,
                    'fk_kecamatan'   => $kecamatanCode,
                    'status'     => true,
                ]);

                $imported[] = $kecamatan;
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
    public function exportToExcel(?string $search = null, ?bool $status = null): string
    {
        $kecamatans = Kecamatan::query()
            ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('kecamatan_name', 'ILIKE', "%{$search}%")
                      ->orWhere('kecamatan_code', 'ILIKE', "%{$search}%")
                      ->orWhere('fk_kabupaten_kota', 'ILIKE', "%{$search}%");
            }))
            ->when(!is_null($status), fn ($q) => $q->where('status', $status))
            ->orderBy('kecamatan_code', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data kecamatan');

        $headers = ['No', 'kecamatan_code', 'kecamatan_name','kabupaten_kota_code', 'kabupaten_kota_name', 'status'];
        $columns = ['A', 'B', 'C', 'D' , 'E','F'];

        foreach ($headers as $index => $headerTitle) {
            $col = $columns[$index];
            $sheet->setCellValue("{$col}1", $headerTitle);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        $rowNumber = 2;
        foreach ($kecamatans as $i => $kecamatan) {
            $sheet->setCellValue("A{$rowNumber}", $i + 1);
            $sheet->setCellValueExplicit("B{$rowNumber}", (string) $kecamatan->kecamatan_code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("C{$rowNumber}", $kecamatan->kecamatan_name);
            $sheet->setCellValue("D{$rowNumber}", $kecamatan->fk_kabupaten_kota);
            $sheet->setCellValue("E{$rowNumber}", $kecamatan->kabupatenKota->kabupaten_kota_name);
            $sheet->setCellValue("F{$rowNumber}", $kecamatan->status ? 'Aktif' : 'Non-Aktif');
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
}
