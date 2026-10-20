<?php

namespace App\Http\Controllers;

use App\Http\Requests\AgamaRequest;
use App\Http\Responses\AgamaResponse;
use App\Repositories\AgamaRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class AgamaController extends Controller
{
    public function __construct(
        private AgamaRepository $agamaRepository,
        private AgamaResponse $agamaResponse
    ) {}

    public function index(Request $request)
    {
        try {
            $perPage = min(max((int) $request->query('per_page', 10), 1), 100);
            $agamas = $this->agamaRepository->paginate($perPage, $request->query('search'));
            return $this->agamaResponse->list($agamas);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    
    public function store(AgamaRequest $request)
    {
        try {
            $agama = $this->agamaRepository->create($request->validated());
            return $this->agamaResponse->success($agama, 'Agama berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->agamaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function show(int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            return $this->agamaResponse->success($agama, 'Data agama berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function update(AgamaRequest $request, int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            $updatedAgama = $this->agamaRepository->update($agama, $request->validated());

            return $this->agamaResponse->success($updatedAgama, 'Agama berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->agamaResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }

    public function destroy(int $id)
    {
        try {
            $agama = $this->agamaRepository->findById($id);

            if (!$agama) {
                return $this->agamaResponse->notFound();
            }

            $this->agamaRepository->delete($agama);

            return $this->agamaResponse->deleted('Agama berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus agama: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->agamaResponse->serverError();
        }
    }
}
