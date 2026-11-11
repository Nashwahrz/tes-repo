<?php

namespace App\Repositories;

use App\Enums\StatusMasterData;
use App\Http\Requests\KelurahanRequest;
use App\Models\Kelurahan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class KelurahanRepository
{
   
    public function findById(int $id): ?Kelurahan
    {
        return Kelurahan::find($id);
    }

   
    public function create(array $data): Kelurahan
    {
        return Kelurahan::create($data);
    }

    
    public function update(Kelurahan $kelurahan, array $data): Kelurahan
    {
        $kelurahan->update($data);
        return $kelurahan->fresh();
    }

  
    public function delete(Kelurahan $kelurahan): bool
    {   
        return (bool) $kelurahan->delete();
    }
    public function paginate(int $perPage = null, ?string $search = null): LengthAwarePaginator
    {
        return Kelurahan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kelurahan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kelurahan_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = null, ?string $search = null): LengthAwarePaginator
    {
        return Kelurahan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kelurahan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kelurahan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = null, ?string $search = null): LengthAwarePaginator
    {
        return Kelurahan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kelurahan_name', 'ILIKE', "%{$search}%")
                ->orWhere('kelurahan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Kelurahan::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Kelurahan::class], function ($q) use ($search) {
                            $q->where('kelurahan_name', 'ILIKE', "%{$search}%")
                            ->orWhere('kelurahan_code', 'ILIKE', "%{$search}%");
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

        $expectedHeader = ['kelurahan_code', 'kelurahan_name','kecamatan_code'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 3) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : kelurahan_code, kelurahan_name,kecamatan_code'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new KelurahanRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $KelurahanCode = isset($columnMap['kelurahan_code']) ? trim((string) ($row[$columnMap['kelurahan_code']] ?? '')) : '';
                $KelurahanName = isset($columnMap['kelurahan_name']) ? trim((string) ($row[$columnMap['kelurahan_name']] ?? '')) : '';
                $kecamatanCode = isset($columnMap['kecamatan_code']) ? trim((string) ($row[$columnMap['kecamatan_code']] ?? '')) : '';

                if ($KelurahanCode === '' && $KelurahanName === '') {
                    continue;
                }

                $rowData = [
                    'kelurahan_code' => $KelurahanCode,
                    'kelurahan_name' => $KelurahanName,
                    'fk_kecamatan'         => $kecamatanCode,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $kelurahan = Kelurahan::create([
                    'kelurahan_code' => $KelurahanCode,
                    'kelurahan_name' => $KelurahanName,
                    'fk_kecamatan'   => $kecamatanCode,
                    'status'     => true,
                ]);

                $imported[] = $kelurahan;
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
        $kelurahans = Kelurahan::query()
            ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('kelurahan_name', 'ILIKE', "%{$search}%")
                      ->orWhere('kelurahan_code', 'ILIKE', "%{$search}%")
                      ->orWhere('fk_kecamatan', 'ILIKE', "%{$search}%");
            }))
            ->when(!is_null($status), fn ($q) => $q->where('status', $status))
            ->orderBy('kelurahan_code', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data kelurahan');

        $headers = ['No', 'kelurahan_code', 'kelurahan_name','kecamatan_code', 'kecamatan_name', 'status'];
        $columns = ['A', 'B', 'C', 'D' , 'E','F'];

        foreach ($headers as $index => $headerTitle) {
            $col = $columns[$index];
            $sheet->setCellValue("{$col}1", $headerTitle);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        $rowNumber = 2;
        foreach ($kelurahans as $i => $kelurahan) {
            $sheet->setCellValue("A{$rowNumber}", $i + 1);
            $sheet->setCellValueExplicit("B{$rowNumber}", (string) $kelurahan->kelurahan_code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("C{$rowNumber}", $kelurahan->kelurahan_name);
            $sheet->setCellValue("D{$rowNumber}", $kelurahan->fk_kecamatan);
            $sheet->setCellValue("E{$rowNumber}", $kelurahan->kecamatan->kecamatan_name);
            $sheet->setCellValue("F{$rowNumber}", StatusMasterData::labelFromBoolean($kelurahan->status));
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
