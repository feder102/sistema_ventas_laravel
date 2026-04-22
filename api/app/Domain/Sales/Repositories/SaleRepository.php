<?php

declare(strict_types=1);

namespace App\Domain\Sales\Repositories;

use App\Domain\Sales\Models\Sale;
use Illuminate\Database\Eloquent\Collection;

class SaleRepository
{
    public function all(?string $from = null, ?string $to = null, ?int $customerId = null): Collection
    {
        return Sale::with(['customer', 'items'])
            ->when($from, fn ($q) => $q->whereDate('created_at', '>=', $from))
            ->when($to, fn ($q) => $q->whereDate('created_at', '<=', $to))
            ->when($customerId, fn ($q) => $q->where('customer_id', $customerId))
            ->orderByDesc('created_at')
            ->get();
    }

    public function findById(int $id): Sale
    {
        return Sale::with(['customer', 'items'])->findOrFail($id);
    }

    public function create(array $saleData, array $items): Sale
    {
        $sale = Sale::create($saleData);
        $sale->items()->createMany($items);
        return $sale->load(['customer', 'items']);
    }

    public function delete(Sale $sale): void
    {
        $sale->delete();
    }
}
