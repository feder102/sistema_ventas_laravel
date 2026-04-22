<?php

declare(strict_types=1);

namespace App\Domain\Products\Services;

use App\Domain\Products\Models\Product;
use App\Domain\Products\Repositories\ProductRepository;
use Illuminate\Database\Eloquent\Collection;

class ProductService
{
    public function __construct(private readonly ProductRepository $repository) {}

    public function list(?string $search = null, bool $lowStock = false): Collection
    {
        return $this->repository->all($search, $lowStock);
    }

    public function findById(int $id): Product
    {
        return $this->repository->findById($id);
    }

    public function findByBarcode(string $barcode): ?Product
    {
        return $this->repository->findByBarcode($barcode);
    }

    public function create(array $data): Product
    {
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Product
    {
        $product = $this->repository->findById($id);
        return $this->repository->update($product, $data);
    }

    public function delete(int $id): void
    {
        $product = $this->repository->findById($id);
        $this->repository->delete($product);
    }
}
