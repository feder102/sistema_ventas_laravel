<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Customers\Services\CustomerService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreCustomerRequest;
use App\Http\Requests\Customer\UpdateCustomerRequest;
use App\Http\Resources\CustomerResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        return CustomerResource::collection(
            $this->service->list($request->string('search')->toString() ?: null)
        );
    }

    public function show(int $customer): JsonResponse
    {
        return response()->json(['data' => new CustomerResource($this->service->findById($customer))]);
    }

    public function store(StoreCustomerRequest $request): JsonResponse
    {
        $customer = $this->service->create($request->validated());

        return response()->json(['data' => new CustomerResource($customer)], 201);
    }

    public function update(UpdateCustomerRequest $request, int $customer): JsonResponse
    {
        $updated = $this->service->update($customer, $request->validated());

        return response()->json(['data' => new CustomerResource($updated)]);
    }

    public function destroy(int $customer): JsonResponse
    {
        $this->service->delete($customer);

        return response()->json(['message' => 'Customer deleted']);
    }
}
