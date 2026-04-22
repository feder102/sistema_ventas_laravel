<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Products\Services\ProductService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Product\StoreProductRequest;
use App\Http\Requests\Product\UpdateProductRequest;
use App\Http\Resources\ProductResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function __construct(private readonly ProductService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $products = $this->service->list(
            search:   $request->string('search')->toString() ?: null,
            lowStock: $request->boolean('low_stock'),
        );

        return ProductResource::collection($products);
    }

    public function show(int $product): JsonResponse
    {
        return response()->json(['data' => new ProductResource($this->service->findById($product))]);
    }

    public function showByBarcode(string $barcode): JsonResponse
    {
        $product = $this->service->findByBarcode($barcode);

        if ($product === null) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return response()->json(['data' => new ProductResource($product)]);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = $this->service->create($request->validated());

        return response()->json(['data' => new ProductResource($product)], 201);
    }

    public function update(UpdateProductRequest $request, int $product): JsonResponse
    {
        $updated = $this->service->update($product, $request->validated());

        return response()->json(['data' => new ProductResource($updated)]);
    }

    public function destroy(int $product): JsonResponse
    {
        $this->service->delete($product);

        return response()->json(['message' => 'Product deleted']);
    }
}
