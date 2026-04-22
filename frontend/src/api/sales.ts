import type { Sale } from '../types'
import apiClient from './client'

export interface SalePayload {
  customer_id: number | null
  items: Array<{ product_id: number; quantity: number }>
}

export const salesApi = {
  list:    (params?: { from?: string; to?: string; customer_id?: number }) =>
    apiClient.get<{ data: Sale[] }>('/sales', { params }),

  show:    (id: number) =>
    apiClient.get<{ data: Sale }>(`/sales/${id}`),

  create:  (payload: SalePayload) =>
    apiClient.post<{ data: Sale }>('/sales', payload),

  destroy: (id: number) =>
    apiClient.delete(`/sales/${id}`),
}
