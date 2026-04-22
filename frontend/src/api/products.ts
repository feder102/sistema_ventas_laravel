import type { Product } from '../types'
import apiClient from './client'

export interface ProductPayload {
  codigo_barras: string
  descripcion: string
  precio_compra: number
  precio_venta: number
  existencia: number
}

export const productsApi = {
  list:       (params?: { search?: string; low_stock?: boolean }) =>
    apiClient.get<{ data: Product[] }>('/products', { params }),

  show:       (id: number) =>
    apiClient.get<{ data: Product }>(`/products/${id}`),

  byBarcode:  (barcode: string) =>
    apiClient.get<{ data: Product }>(`/products/barcode/${encodeURIComponent(barcode)}`),

  create:     (payload: ProductPayload) =>
    apiClient.post<{ data: Product }>('/products', payload),

  update:     (id: number, payload: Partial<ProductPayload>) =>
    apiClient.put<{ data: Product }>(`/products/${id}`, payload),

  destroy:    (id: number) =>
    apiClient.delete(`/products/${id}`),
}
