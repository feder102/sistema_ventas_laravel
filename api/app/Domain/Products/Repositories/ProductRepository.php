<?php

declare(strict_types=1);

namespace App\Domain\Products\Repositories;

use App\Domain\Products\Models\Product;
use Illuminate\Database\Eloquent\Collection;

class ProductRepository
{
    public function all(?string $search = null, bool $lowStock = false): Collection
    {
        return Product::query()
            ->when($search, fn ($q) => $q->where(function ($q) use ($search): void {
                $q->where('descripcion', 'like', "%{$search}%")
                  ->orWhere('codigo_barras', 'like', "%{$search}%");
            }))
            ->when($lowStock, fn ($q) => $q->where('existencia', '<=', 5))
            ->orderBy('descripcion')
            ->get();
    }

    public function findById(int $id): Product
    {
        return Product::findOrFail($id);
    }

    public function findByBarcode(string $barcode): ?Product
    {
        return Product::where('codigo_barras', $barcode)->first();
    }

    public function create(array $data): Product
    {
        return Product::create($data);
    }

    public function update(Product $product, array $data): Product
    {
        $product->fill($data)->save();
        return $product->fresh();
    }

    public function delete(Product $product): void
    {
        $product->delete();
    }
}
