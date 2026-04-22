export interface User {
  id: number
  name: string
  email: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  codigo_barras: string
  descripcion: string
  precio_compra: string
  precio_venta: string
  utilidad: string
  existencia: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  nombre: string
  telefono: string
  created_at: string
  updated_at: string
}

export interface SaleItem {
  id: number
  sale_id: number
  descripcion: string
  codigo_barras: string
  unit_price: string
  quantity: string
  subtotal: string
}

export interface Sale {
  id: number
  customer_id: number | null
  customer: Customer | null
  total: string
  items_count?: number
  items?: SaleItem[]
  created_at: string
  updated_at: string
}

export interface CartItem {
  productId: number
  barcode: string
  descripcion: string
  unit_price: number
  quantity: number
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}

export interface PendingSale {
  localId?: number
  customer_id: number | null
  items: Array<{ product_id: number; quantity: number }>
  createdAt: string
}
