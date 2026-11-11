<?php

namespace App\Repositories;

use App\Enums\StatusMasterData;
use App\Http\Requests\AgamaRequest;
use App\Models\Agama;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Spatie\Activitylog\Models\Activity;

class AgamaRepository
{
    // public function all(): Collection
    // {
    //     return Agama::all();
    // }

    public function findById(int|string $id): ?Agama
    {
        return Agama::find($id);
    }

   
    public function create(array $data): Agama
    {
        return Agama::create($data);
    }

    
    public function update(Agama $dealer, array $data): Agama
    {
        $dealer->update($data);
        return $dealer->fresh();
    }

  
    public function delete(Agama $dealer): bool
    {
        return (bool) $dealer->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Agama::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('agama_name', 'ILIKE', "%{$search}%")
                ->orWhere('agama_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Agama::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('agama_name', 'ILIKE', "%{$search}%")
                ->orWhere('agama_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Agama::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('agama_name', 'ILIKE', "%{$search}%")
                ->orWhere('agama_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Agama::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Agama::class], function ($q) use ($search) {
                            $q->where('agama_name', 'ILIKE', "%{$search}%")
                            ->orWhere('agama_code', 'ILIKE', "%{$search}%");
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

        $expectedHeader = ['agama_code', 'agama_name'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 2) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus: agama_code, agama_name'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new AgamaRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $agamaCode = isset($columnMap['agama_code']) ? trim((string) ($row[$columnMap['agama_code']] ?? '')) : '';
                $agamaName = isset($columnMap['agama_name']) ? trim((string) ($row[$columnMap['agama_name']] ?? '')) : '';

                if ($agamaCode === '' && $agamaName === '') {
                    continue;
                }

                $rowData = [
                    'agama_code' => $agamaCode,
                    'agama_name' => $agamaName,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $agama = Agama::create([
                    'agama_code' => $agamaCode,
                    'agama_name' => $agamaName,
                    'status'     => true,
                ]);

                $imported[] = $agama;
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
        $agamas = Agama::query()
            ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('agama_name', 'ILIKE', "%{$search}%")
                      ->orWhere('agama_code', 'ILIKE', "%{$search}%");
            }))
            ->when(!is_null($status), fn ($q) => $q->where('status', $status))
            ->orderBy('agama_code', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Agama');

        $headers = ['No', 'agama_code', 'agama_name', 'status'];
        $columns = ['A', 'B', 'C', 'D'];

        foreach ($headers as $index => $headerTitle) {
            $col = $columns[$index];
            $sheet->setCellValue("{$col}1", $headerTitle);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        $rowNumber = 2;
        foreach ($agamas as $i => $agama) {
            $sheet->setCellValue("A{$rowNumber}", $i + 1);
            $sheet->setCellValueExplicit("B{$rowNumber}", (string) $agama->agama_code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("C{$rowNumber}", $agama->agama_name);
            $sheet->setCellValue("D{$rowNumber}", StatusMasterData::labelFromBoolean($agama->status));
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
