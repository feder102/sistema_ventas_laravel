<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Domain\Users\Services\UserService;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function __construct(private readonly UserService $service) {}

    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection($this->service->list());
    }

    public function show(int $user): JsonResponse
    {
        return response()->json(['data' => new UserResource($this->service->findById($user))]);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create($request->validated());

        return response()->json(['data' => new UserResource($user)], 201);
    }

    public function update(UpdateUserRequest $request, int $user): JsonResponse
    {
        $updated = $this->service->update($user, $request->validated());

        return response()->json(['data' => new UserResource($updated)]);
    }

    public function destroy(int $user): JsonResponse
    {
        $this->service->delete($user);

        return response()->json(['message' => 'User deleted']);
    }
}
