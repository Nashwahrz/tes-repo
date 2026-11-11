<?php

namespace App\Repositories;

use App\Enums\StatusMasterData;
use App\Enums\TypeHeaderPekerjaan;
use App\Http\Requests\PekerjaanRequest;
use App\Models\Pekerjaan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Spatie\Activitylog\Models\Activity;

class PekerjaanRepository
{
   
    public function findById(int $id): ?Pekerjaan
    {
        return Pekerjaan::find($id);
    }

   
    public function create(array $data): Pekerjaan
    {
        $typeHeader = $data['type_header'] instanceof TypeHeaderPekerjaan
            ? $data['type_header']
            : TypeHeaderPekerjaan::tryFrom($data['type_header'] ?? '');

       
        if ($typeHeader?->isHeader() || empty($data['id_parent'])) {
            $data['id_parent'] = (int) $data['pekerjaan_code'];
        }

        return Pekerjaan::create($data);
    }

    public function update(Pekerjaan $pekerjaan, array $data): Pekerjaan
    {
        $typeHeader = isset($data['type_header'])
            ? ($data['type_header'] instanceof TypeHeaderPekerjaan
                ? $data['type_header']
                : TypeHeaderPekerjaan::tryFrom($data['type_header']))
            : $pekerjaan->type_header;


        if ($typeHeader?->isHeader()) {
            $code = $data['pekerjaan_code'] ?? $pekerjaan->pekerjaan_code;
            $data['id_parent'] = (int) $code;
        }

        $pekerjaan->update($data);
        return $pekerjaan->fresh();
    }

    public function delete(Pekerjaan $pekerjaan): bool
    {
        return (bool) $pekerjaan->delete();
    }
    public function paginateAll(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    // public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    // {
    //     return Pekerjaan::query()
    //         ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
    //             $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
    //             ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
    //         }))
    //         ->where('status',true)
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // // }
    // public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    // {
    //     return Pekerjaan::query()
    //         ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
    //             $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
    //             ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
    //         }))
    //         ->where('status',false)
    //         ->latest('id')
    //         ->paginate($perPage)
    //         ->withQueryString();
    // }
    public function paginate(): array
    {
        $tableName = (new Pekerjaan())->getTable();

        $headers = Pekerjaan::query()
            ->where('type_header', TypeHeaderPekerjaan::Header)
            ->where(function ($q) use ($tableName) {
                $q->where('status', true)
                  ->orWhereExists(function ($sub) use ($tableName) {
                      $sub->selectRaw('1')
                          ->from("{$tableName} as children")
                          ->whereRaw("CAST(children.id_parent AS TEXT) = {$tableName}.pekerjaan_code")
                          ->where('children.type_header', TypeHeaderPekerjaan::Detail->value)
                          ->where('children.status', true);
                  });
            })
            ->with(['children' => function ($q) {
                $q->where('type_header', TypeHeaderPekerjaan::Detail)
                  ->where('status', true)
                  ->orderBy('sequence')
                  ->orderBy('pekerjaan_code');
            }])
            ->orderBy('sequence')
            ->orderBy('pekerjaan_code')
            ->get();

        return $headers->map(function ($header) {
            $hasActiveChildren = $header->children->isNotEmpty();

            return [
                'pekerjaan_code' => $header->pekerjaan_code,
                'pekerjaan_name' => $header->pekerjaan_name,
                'sector_job'     => $header->sector_job,
                'sequence'       => $header->sequence,
                'type_header'    => $header->type_header?->value,
                'is_selectable'  => (bool) $header->status && !$hasActiveChildren,
                'children'       => $header->children->map(fn ($child) => [
                    'pekerjaan_code' => $child->pekerjaan_code,
                    'pekerjaan_name' => $child->pekerjaan_name,
                    'sector_job'     => $child->sector_job,
                    'sequence'       => $child->sequence,
                    'type_header'    => $child->type_header?->value,
                    'is_selectable'  => true,
                ])->values()->all(),
            ];
        })->values()->all();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Pekerjaan::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Pekerjaan::class], function ($q) use ($search) {
                            $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                            ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
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

        $expectedHeader = ['pekerjaan_code', 'pekerjaan_name','sequence','type_header','sector_job','id_parent','status'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 7) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : pekerjaan_code, pekerjaan_name,sequence,type_header,sector_job,id_parent,status'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new PekerjaanRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $pekerjaanCode = isset($columnMap['pekerjaan_code']) ? trim((string) ($row[$columnMap['pekerjaan_code']] ?? '')) : '';
                $pekerjaanName = isset($columnMap['pekerjaan_name']) ? trim((string) ($row[$columnMap['pekerjaan_name']] ?? '')) : '';
                $sequence = isset($columnMap['sequence']) ? trim((string) ($row[$columnMap['sequence']] ?? '')) : '';
                $typeHeader = isset($columnMap['type_header']) ? trim((string) ($row[$columnMap['type_header']] ?? '')) : '';
                $sectorJob = isset($columnMap['sector_job']) ? trim((string) ($row[$columnMap['sector_job']] ?? '')) : '';
                $idParent = isset($columnMap['id_parent']) ? trim((string) ($row[$columnMap['id_parent']] ?? '')) : '';
                $status = isset($columnMap['status']) ? trim((string) ($row[$columnMap['status']] ?? '')) : '';
                
                if ($pekerjaanCode === '' && $pekerjaanName === '') {
                    continue;
                }

                $rowData = [
                    'pekerjaan_code' => $pekerjaanCode,
                    'pekerjaan_name' => $pekerjaanName,
                    'sequence'       => is_numeric($sequence) ? (int) $sequence : $sequence,
                    'type_header'    => $typeHeader,
                    'sector_job'     => $sectorJob,
                    'id_parent'      => $idParent === '' ? null : $idParent,
                    'status'         => in_array(strtolower($status), ['1', 'true', 'aktif'], true),
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $pekerjaan = $this->create($rowData);

                $imported[] = $pekerjaan;
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
        $pekerjaans = Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                      ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->when(!is_null($status), fn ($q) => $q->where('status', $status))
            ->orderBy('pekerjaan_code', 'asc')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Data Pekerjaan');

        $headers = ['No', 'pekerjaan_code', 'pekerjaan_name','sequence','type_header','sector_job','id_parent','status'];
        $columns = ['A', 'B', 'C','D','E','F','G','H'];

        foreach ($headers as $index => $headerTitle) {
            $col = $columns[$index];
            $sheet->setCellValue("{$col}1", $headerTitle);
            $sheet->getStyle("{$col}1")->getFont()->setBold(true);
        }

        $rowNumber = 2;
        foreach ($pekerjaans as $i => $pekerjaan) {
            $sheet->setCellValue("A{$rowNumber}", $i + 1);
            $sheet->setCellValueExplicit("B{$rowNumber}", (string) $pekerjaan->pekerjaan_code, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("C{$rowNumber}", $pekerjaan->pekerjaan_name);
            $sheet->setCellValue("D{$rowNumber}", $pekerjaan->sequence);
            $sheet->setCellValue("E{$rowNumber}", $pekerjaan->type_header->value);
            $sheet->setCellValue("F{$rowNumber}", $pekerjaan->sector_job);
            $sheet->setCellValue("G{$rowNumber}", $pekerjaan->id_parent);
            $sheet->setCellValue("H{$rowNumber}", StatusMasterData::labelFromBoolean($pekerjaan->status));
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
