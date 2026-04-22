<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SaleItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'sale_id'       => $this->sale_id,
            'descripcion'   => $this->descripcion,
            'codigo_barras' => $this->codigo_barras,
            'unit_price'    => $this->unit_price,
            'quantity'      => $this->quantity,
            'subtotal'      => $this->subtotal,
        ];
    }
}
