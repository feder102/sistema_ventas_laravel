<?php

declare(strict_types=1);

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'codigo_barras' => $this->codigo_barras,
            'descripcion'   => $this->descripcion,
            'precio_compra' => $this->precio_compra,
            'precio_venta'  => $this->precio_venta,
            'utilidad'      => $this->utilidad,
            'existencia'    => $this->existencia,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
