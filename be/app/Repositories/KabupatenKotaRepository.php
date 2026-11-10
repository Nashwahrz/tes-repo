<?php

namespace App\Repositories;

use App\Http\Requests\KabupatenKotaRequest;
use App\Models\KabupatenKota;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

class KabupatenKotaRepository
{
   
    public function findById(int $id): ?KabupatenKota
    {
        return KabupatenKota::find($id);
    }

   
    public function create(array $data): KabupatenKota
    {
        return KabupatenKota::create($data);
    }

    
    public function update(KabupatenKota $kabupatenKota, array $data): KabupatenKota
    {
        $kabupatenKota->update($data);
        return $kabupatenKota->fresh();
    }

  
    public function delete(KabupatenKota $kabupatenKota): bool
    {
        return (bool) $kabupatenKota->delete();
    }
    public function paginate(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',true)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function paginateNonAktif(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        return KabupatenKota::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search) {
                $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
            }))
            ->where('status',false)
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }
    public function getAllLogs(int $perPage = 10, ?string $search = null): LengthAwarePaginator
    {
        $logs = Activity::query()
            ->where('subject_type', KabupatenKota::class)
            ->with(['causer:id,name', 'subject'])
            ->when($search, function ($q) use ($search) {
                        $q->whereHasMorph('subject', [KabupatenKota::class], function ($q) use ($search) {
                            $q->where('kabupaten_kota_name', 'ILIKE', "%{$search}%")
                            ->orWhere('kabupaten_kota_code', 'ILIKE', "%{$search}%");
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

        $expectedHeader = ['kabupaten_kota_code', 'kabupaten_kota_name','provinsi_code'];
        $actualHeader   = array_values(array_filter($normalizedHeader));

        if (array_slice($actualHeader, 0, 3) !== $expectedHeader) {
            return [
                'success'  => 0,
                'failed'   => 0,
                'errors'   => ['Header Excel tidak sesuai format. Harus : kabupaten_kota_code, kabupaten_kota_name,provinsi_code'],
                'imported' => [],
            ];
        }

        $columnMap = array_flip($normalizedHeader); 

        $formRequest = new KabupatenKotaRequest();
        $rules       = $formRequest->rules();
        $messages    = $formRequest->messages();

        $success  = 0;
        $failed   = 0;
        $errors   = [];
        $imported = [];

        return DB::transaction(function () use ($rows, $columnMap, $rules, $messages, &$success, &$failed, &$errors, &$imported) {
            foreach ($rows as $rowIndex => $row) {
                $rowNumber = $rowIndex + 1; 

                $KabupatenKotaCode = isset($columnMap['kabupaten_kota_code']) ? trim((string) ($row[$columnMap['kabupaten_kota_code']] ?? '')) : '';
                $KabupatenKotaName = isset($columnMap['kabupaten_kota_name']) ? trim((string) ($row[$columnMap['kabupaten_kota_name']] ?? '')) : '';
                $ProvinsiCode = isset($columnMap['provinsi_code']) ? trim((string) ($row[$columnMap['provinsi_code']] ?? '')) : '';

                if ($KabupatenKotaCode === '' && $KabupatenKotaName === '') {
                    continue;
                }

                $rowData = [
                    'kabupaten_kota_code' => $KabupatenKotaCode,
                    'kabupaten_kota_name' => $KabupatenKotaName,
                    'fk_provinsi'         => $ProvinsiCode,
                ];

                $validator = Validator::make($rowData, $rules, $messages);

                if ($validator->fails()) {
                    $failed++;
                    $errors[] = "Baris {$rowNumber}: " . implode(', ', $validator->errors()->all());
                    continue;
                }

                $kabupatenKota = KabupatenKota::create([
                    'kabupaten_kota_code' => $KabupatenKotaCode,
                    'kabupaten_kota_name' => $KabupatenKotaName,
                    'fk_provinsi'   => $ProvinsiCode,
                    'status'     => true,
                ]);

                $imported[] = $kabupatenKota;
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
