<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'customer_id' => $this->customer_id,
            'customer'    => $this->whenLoaded('customer', fn () => new CustomerResource($this->customer)),
            'total'       => $this->total,
            'items_count' => $this->whenLoaded('items', fn () => $this->items->count()),
            'items'       => SaleItemResource::collection($this->whenLoaded('items')),
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
