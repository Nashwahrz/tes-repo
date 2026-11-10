<?php

namespace App\Repositories;

use App\Http\Requests\ProvinsiRequest;
use App\Models\Provinsi;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Spatie\Activitylog\Models\Activity;

class ProvinsiRepository
{
   
    public function findById(int $id): ?Provinsi
    {
        return Provinsi::find($id);
    }

   
    public function create(array $data): Provinsi
    {
        return Provinsi::create($data);
    }

    
    public function update(Provinsi $provinsi, array $data): Provinsi
    {
        $provinsi->update($data);
        return $provinsi->fresh();
    }

  
    public function delete(Provinsi $provinsi): bool
    {
        return (bool) $provinsi->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Provinsi::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('provinsi_name', 'ILIKE', "%{$search}%")
                ->orWhere('provinsi_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Provinsi::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('provinsi_name', 'ILIKE', "%{$search}%")
                ->orWhere('provinsi_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Provinsi::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('provinsi_name', 'ILIKE', "%{$search}%")
                ->orWhere('provinsi_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', Provinsi::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [Provinsi::class], function ($q) use ($search) {
                            $q->where('provinsi_name', 'ILIKE', "%{$search}%")
                            ->orWhere('provinsi_code', 'ILIKE', "%{$search}%");
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

        $expectedHeader = ['provinsi_code', 'provinsi_name'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 2) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : provinsi_code, provinsi_name'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new ProvinsiRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $provinsiCode = isset($columnMap['provinsi_code']) ? trim((string) ($row[$columnMap['provinsi_code']] ?? '')) : '';
                $provinsiName = isset($columnMap['provinsi_name']) ? trim((string) ($row[$columnMap['provinsi_name']] ?? '')) : '';

                if ($provinsiCode === '' && $provinsiName === '') {
                    continue;
                }

                $rowData = [
                    'provinsi_code' => $provinsiCode,
                    'provinsi_name' => $provinsiName,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $provinsi = Provinsi::create([
                    'provinsi_code' => $provinsiCode,
                    'provinsi_name' => $provinsiName,
                    'status'     => true,
                ]);

                $imported[] = $provinsi;
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
}
