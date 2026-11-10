<?php

namespace App\Repositories;

use App\Http\Requests\KelurahanRequest;
use App\Models\Kelurahan;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
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
                $KecamatanCode = isset($columnMap['kecamatan_code']) ? trim((string) ($row[$columnMap['kecamatan_code']] ?? '')) : '';

                if ($KelurahanCode === '' && $KelurahanName === '') {
                    continue;
                }

                $rowData = [
                    'kelurahan_code' => $KelurahanCode,
                    'kelurahan_name' => $KelurahanName,
                    'fk_kecamatan'         => $KecamatanCode,
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
                    'fk_kecamatan'   => $KecamatanCode,
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
}
