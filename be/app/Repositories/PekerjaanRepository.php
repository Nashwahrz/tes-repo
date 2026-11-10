<?php

namespace App\Repositories;

use App\Http\Requests\PekerjaanRequest;
use App\Models\Pekerjaan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Spatie\Activitylog\Models\Activity;

class PekerjaanRepository
{
   
    public function findById(int $id): ?Pekerjaan
    {
        return Pekerjaan::find($id);
    }

   
    public function create(array $data): Pekerjaan
    {
        return Pekerjaan::create($data);
    }

    
    public function update(Pekerjaan $dealer, array $data): Pekerjaan
    {
        $dealer->update($data);
        return $dealer->fresh();
    }

  
    public function delete(Pekerjaan $dealer): bool
    {
        return (bool) $dealer->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
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
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return Pekerjaan::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('pekerjaan_name', 'ILIKE', "%{$search}%")
                ->orWhere('pekerjaan_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
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

        $expectedHeader = ['pekerjaan_code', 'pekerjaan_name'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 2) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : pekerjaan_code, pekerjaan_name'],
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

                if ($pekerjaanCode === '' && $pekerjaanName === '') {
                    continue;
                }

                $rowData = [
                    'pekerjaan_code' => $pekerjaanCode,
                    'pekerjaan_name' => $pekerjaanName,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $pekerjaan = Pekerjaan::create([
                    'pekerjaan_code' => $pekerjaanCode,
                    'pekerjaan_name' => $pekerjaanName,
                    'status'     => true,
                ]);

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
}
