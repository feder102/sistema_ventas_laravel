<?php

declare(strict_types=1);

namespace App\Domain\Sales\Services;

use App\Domain\Products\Models\Product;
use App\Domain\Sales\Models\Sale;
use App\Domain\Sales\Repositories\SaleRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\DB;

class SaleService
{
    public function __construct(private readonly SaleRepository $repository) {}

    public function list(?string $from = null, ?string $to = null, ?int $customerId = null): Collection
    {
        return $this->repository->all($from, $to, $customerId);
    }

    public function findById(int $id): Sale
    {
        return $this->repository->findById($id);
    }

    /**
     * @param array{customer_id?: int|null, items: array<int, array{product_id: int, quantity: float}>} $payload
     */
    public function create(array $payload): Sale
    {
        return DB::transaction(function () use ($payload): Sale {
            $itemRows = [];
            $errors   = [];

            foreach ($payload['items'] as $index => $item) {
                /** @var Product $product */
                $product  = Product::lockForUpdate()->findOrFail($item['product_id']);
                $quantity = (float) $item['quantity'];

                if ($product->existencia < $quantity) {
                    $errors["items.{$index}.quantity"] = [
                        "Only {$product->existencia} units of '{$product->descripcion}' available"
                    ];
                    continue;
                }

                $product->decrement('existencia', $quantity);

                $itemRows[] = [
                    'descripcion'  => $product->descripcion,
                    'codigo_barras' => $product->codigo_barras,
                    'unit_price'   => $product->precio_venta,
                    'quantity'     => $quantity,
                ];
            }

            if (!empty($errors)) {
                throw new HttpResponseException(
                    response()->json([
                        'message' => 'Insufficient stock',
                        'errors'  => $errors,
                    ], 422)
                );
            }

            return $this->repository->create(
                ['customer_id' => $payload['customer_id'] ?? null],
                $itemRows,
            );
        });
    }

    public function delete(int $id): void
    {
        $sale = $this->repository->findById($id);
        $this->repository->delete($sale);
    }
}
