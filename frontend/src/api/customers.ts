import type { Customer } from '../types'
import apiClient from './client'

export interface CustomerPayload {
  nombre: string
  telefono: string
}

export const customersApi = {
  list:    (params?: { search?: string }) =>
    apiClient.get<{ data: Customer[] }>('/customers', { params }),

  show:    (id: number) =>
    apiClient.get<{ data: Customer }>(`/customers/${id}`),

  create:  (payload: CustomerPayload) =>
    apiClient.post<{ data: Customer }>('/customers', payload),

  update:  (id: number, payload: Partial<CustomerPayload>) =>
    apiClient.put<{ data: Customer }>(`/customers/${id}`, payload),

  destroy: (id: number) =>
    apiClient.delete(`/customers/${id}`),
}
