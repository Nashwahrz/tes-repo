<?php

namespace App\Services;

use App\Enums\LogKonsumenAction;
use App\Enums\StatusKonsumen;
use App\Enums\TypeTempKonsumen;
use App\Models\Konsumen;
use App\Models\LogActivityKonsumen;
use App\Models\TempKonsumen;
use App\Models\User;
use App\Repositories\LogActivityKonsumenRepository;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class LogActivityKonsumenService
{
    public function __construct(
        protected ?LogActivityKonsumenRepository $repository = null
    ) {
        $this->repository = $repository ?? app(LogActivityKonsumenRepository::class);
    }

    public function logSubmitted(TempKonsumen $temp, ?User $actor = null): LogActivityKonsumen
    {
        $actor   = $actor ?? Auth::user();
        $meUser  = $temp->relationLoaded('me') ? $temp->me : User::find($temp->fk_me);
        $typeVal = $temp->type instanceof TypeTempKonsumen ? $temp->type->value : (string) $temp->type;

        $desc = sprintf(
            'ME %s mengajukan data konsumen: %s (NIK: %s) dengan tipe pengajuan "%s".',
            $meUser?->name ?? 'Unknown',
            $temp->konsumen_name,
            $temp->nik,
            $typeVal
        );

        return $this->record([
            'action'           => LogKonsumenAction::Submitted,
            'fk_konsumen'      => $temp->fk_konsumen,
            'fk_temp_konsumen' => $temp->id,
            'nik'              => $temp->nik,
            'konsumen_name'    => $temp->konsumen_name,
            'fk_me'            => $temp->fk_me,
            'me_name'          => $meUser?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'Sistem',
            'status'           => StatusKonsumen::Pending,
            'type'             => $temp->type,
            'note'             => null,
            'description'      => $desc,
            'old_data'         => null,
            'new_data'         => $this->filterData($temp->toArray()),
        ]);
    }

    public function logUpdated(
        TempKonsumen $temp,
        ?User $actor = null,
        ?array $oldData = null,
        ?array $newData = null
    ): LogActivityKonsumen {
        $actor  = $actor ?? Auth::user();
        $meUser = $temp->relationLoaded('me') ? $temp->me : User::find($temp->fk_me);

        $desc = sprintf(
            'ME %s memperbarui data pengajuan konsumen: %s (NIK: %s).',
            $actor?->name ?? $meUser?->name ?? 'User',
            $temp->konsumen_name,
            $temp->nik
        );

        return $this->record([
            'action'           => LogKonsumenAction::Updated,
            'fk_konsumen'      => $temp->fk_konsumen,
            'fk_temp_konsumen' => $temp->id,
            'nik'              => $temp->nik,
            'konsumen_name'    => $temp->konsumen_name,
            'fk_me'            => $temp->fk_me,
            'me_name'          => $meUser?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'Sistem',
            'status'           => $temp->status,
            'type'             => $temp->type,
            'note'             => $temp->note,
            'description'      => $desc,
            'old_data'         => $oldData ? $this->filterData($oldData) : null,
            'new_data'         => $newData ? $this->filterData($newData) : $this->filterData($temp->toArray()),
        ]);
    }

    public function logVerified(TempKonsumen $temp, Konsumen $konsumen, ?User $actor = null): LogActivityKonsumen
    {
        $actor  = $actor ?? Auth::user();
        $meUser = $temp->relationLoaded('me') ? $temp->me : User::find($temp->fk_me);

        $desc = sprintf(
            'Verifikator %s menyetujui pengajuan konsumen %s (NIK: %s) dari ME %s. Data dipindahkan ke master konsumen.',
            $actor?->name ?? 'Verifikator',
            $konsumen->konsumen_name,
            $konsumen->nik,
            $meUser?->name ?? 'Unknown'
        );

        return $this->record([
            'action'           => LogKonsumenAction::Verified,
            'fk_konsumen'      => $konsumen->id,
            'fk_temp_konsumen' => $temp->id,
            'nik'              => $konsumen->nik,
            'konsumen_name'    => $konsumen->konsumen_name,
            'fk_me'            => $temp->fk_me,
            'me_name'          => $meUser?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'Verifikator',
            'status'           => StatusKonsumen::Diterima,
            'type'             => $temp->type,
            'note'             => null,
            'description'      => $desc,
            'old_data'         => null,
            'new_data'         => $this->filterData($konsumen->toArray()),
        ]);
    }

    public function logRevised(TempKonsumen $temp, ?User $actor = null, ?string $note = null): LogActivityKonsumen
    {
        $actor  = $actor ?? Auth::user();
        $meUser = $temp->relationLoaded('me') ? $temp->me : User::find($temp->fk_me);

        $desc = sprintf(
            'Verifikator %s meminta revisi data konsumen %s (NIK: %s) dari ME %s. Catatan: %s',
            $actor?->name ?? 'Verifikator',
            $temp->konsumen_name,
            $temp->nik,
            $meUser?->name ?? 'Unknown',
            $note ?: '-'
        );

        return $this->record([
            'action'           => LogKonsumenAction::Revised,
            'fk_konsumen'      => $temp->fk_konsumen,
            'fk_temp_konsumen' => $temp->id,
            'nik'              => $temp->nik,
            'konsumen_name'    => $temp->konsumen_name,
            'fk_me'            => $temp->fk_me,
            'me_name'          => $meUser?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'Verifikator',
            'status'           => StatusKonsumen::Revisi,
            'type'             => $temp->type,
            'note'             => $note,
            'description'      => $desc,
            'old_data'         => null,
            'new_data'         => ['status' => 'revisi', 'note' => $note],
        ]);
    }

    public function logRejected(TempKonsumen $temp, ?User $actor = null, ?string $note = null): LogActivityKonsumen
    {
        $actor  = $actor ?? Auth::user();
        $meUser = $temp->relationLoaded('me') ? $temp->me : User::find($temp->fk_me);

        $desc = sprintf(
            'Verifikator %s menolak pengajuan data konsumen %s (NIK: %s) dari ME %s. Catatan: %s',
            $actor?->name ?? 'Verifikator',
            $temp->konsumen_name,
            $temp->nik,
            $meUser?->name ?? 'Unknown',
            $note ?: '-'
        );

        return $this->record([
            'action'           => LogKonsumenAction::Rejected,
            'fk_konsumen'      => $temp->fk_konsumen,
            'fk_temp_konsumen' => $temp->id,
            'nik'              => $temp->nik,
            'konsumen_name'    => $temp->konsumen_name,
            'fk_me'            => $temp->fk_me,
            'me_name'          => $meUser?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'Verifikator',
            'status'           => StatusKonsumen::Ditolak,
            'type'             => $temp->type,
            'note'             => $note,
            'description'      => $desc,
            'old_data'         => null,
            'new_data'         => ['status' => 'ditolak', 'note' => $note],
        ]);
    }

    public function logLinked(Konsumen $konsumen, ?User $actor = null): LogActivityKonsumen
    {
        $actor = $actor ?? Auth::user();

        $desc = sprintf(
            'ME %s menambahkan data konsumen terdaftar: %s (NIK: %s) ke dalam daftar konsumennya.',
            $actor?->name ?? 'ME',
            $konsumen->konsumen_name,
            $konsumen->nik
        );

        return $this->record([
            'action'           => LogKonsumenAction::Linked,
            'fk_konsumen'      => $konsumen->id,
            'fk_temp_konsumen' => null,
            'nik'              => $konsumen->nik,
            'konsumen_name'    => $konsumen->konsumen_name,
            'fk_me'            => $actor?->id,
            'me_name'          => $actor?->name,
            'fk_causer'        => $actor?->id,
            'causer_name'      => $actor?->name ?? 'ME',
            'status'           => StatusKonsumen::Diterima,
            'type'             => null,
            'note'             => null,
            'description'      => $desc,
            'old_data'         => null,
            'new_data'         => $this->filterData($konsumen->toArray()),
        ]);
    }

    public function record(array $data): LogActivityKonsumen
    {
        return $this->repository->create([
            'action'           => $data['action'],
            'fk_konsumen'      => $data['fk_konsumen']      ?? null,
            'fk_temp_konsumen' => $data['fk_temp_konsumen'] ?? null,
            'nik'              => $data['nik'],
            'konsumen_name'    => $data['konsumen_name'],
            'fk_me'            => $data['fk_me']            ?? null,
            'me_name'          => $data['me_name']          ?? null,
            'fk_causer'        => $data['fk_causer']        ?? Auth::id(),
            'causer_name'      => $data['causer_name']      ?? Auth::user()?->name ?? 'Sistem',
            'status'           => $data['status'],
            'type'             => $data['type']             ?? null,
            'note'             => $data['note']             ?? null,
            'description'      => $data['description']      ?? null,
            'old_data'         => $data['old_data']         ?? null,
            'new_data'         => $data['new_data']         ?? null,
            'ip_address'       => $data['ip_address']       ?? Request::ip(),
            'user_agent'       => $data['user_agent']       ?? Request::userAgent(),
            'created_at'       => now(),
        ]);
    }

    protected function filterData(array $data): array
    {
        unset($data['created_at'], $data['updated_at']);
        return $data;
    }
}

