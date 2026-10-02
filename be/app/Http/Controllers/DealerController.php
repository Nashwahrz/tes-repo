<?php

namespace App\Http\Controllers;

use App\Http\Requests\DealerRequest;
use App\Http\Responses\DealerResponse;
use App\Repositories\DealerRepository;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class DealerController extends Controller
{
    public function __construct(
        private DealerRepository $dealerRepository,
        private DealerResponse $dealerResponse
    ) {}

    public function index()
    {
        try {
            $dealers = $this->dealerRepository->all();
            return $this->dealerResponse->list($dealers);
        } catch (Throwable $e) {
            Log::error('Gagal mengambil data dealer: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->dealerResponse->serverError();
        }
    }

    
    public function store(DealerRequest $request)
    {
        try {
            $dealer = $this->dealerRepository->create($request->validated());
            return $this->dealerResponse->success($dealer, 'Dealer berhasil ditambahkan.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->dealerResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal menambahkan dealer: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->dealerResponse->serverError();
        }
    }

    public function show(string|int $id)
    {
        try {
            $dealer = $this->dealerRepository->findById($id);

            if (!$dealer) {
                return $this->dealerResponse->notFound();
            }

            return $this->dealerResponse->success($dealer, 'Data dealer berhasil ditemukan.');
        } catch (Throwable $e) {
            Log::error('Gagal mengambil detail dealer: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->dealerResponse->serverError();
        }
    }

    public function update(DealerRequest $request, string|int $id)
    {
        try {
            $dealer = $this->dealerRepository->findById($id);

            if (!$dealer) {
                return $this->dealerResponse->notFound();
            }

            $updatedDealer = $this->dealerRepository->update($dealer, $request->validated());

            return $this->dealerResponse->success($updatedDealer, 'Dealer berhasil diperbarui.');
        } catch (UniqueConstraintViolationException $e) {
            return $this->dealerResponse->nameTaken();
        } catch (Throwable $e) {
            Log::error('Gagal memperbarui dealer: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->dealerResponse->serverError();
        }
    }

    public function destroy(string|int $id)
    {
        try {
            $dealer = $this->dealerRepository->findById($id);

            if (!$dealer) {
                return $this->dealerResponse->notFound();
            }

            $this->dealerRepository->delete($dealer);

            return $this->dealerResponse->deleted('Dealer berhasil dihapus.');
        } catch (Throwable $e) {
            Log::error('Gagal menghapus dealer: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return $this->dealerResponse->serverError();
        }
    }
}
