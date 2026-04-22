<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Sales\Services\SaleService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sale\StoreSaleRequest;
use App\Http\Resources\SaleResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SaleController extends Controller
{
    public function __construct(private readonly SaleService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $sales = $this->service->list(
            from:       $request->string('from')->toString() ?: null,
            to:         $request->string('to')->toString() ?: null,
            customerId: $request->integer('customer_id') ?: null,
        );

        return SaleResource::collection($sales);
    }

    public function show(int $sale): JsonResponse
    {
        return response()->json(['data' => new SaleResource($this->service->findById($sale))]);
    }

    public function store(StoreSaleRequest $request): JsonResponse
    {
        $sale = $this->service->create($request->validated());

        return response()->json(['data' => new SaleResource($sale)], 201);
    }

    public function destroy(int $sale): JsonResponse
    {
        $this->service->delete($sale);

        return response()->json(['message' => 'Sale deleted']);
    }
}
