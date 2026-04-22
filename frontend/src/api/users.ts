import type { User } from '../types'
import apiClient from './client'

export interface UserPayload {
  name: string
  email: string
  password?: string
  password_confirmation?: string
}

export const usersApi = {
  list:    () =>
    apiClient.get<{ data: User[] }>('/users'),

  show:    (id: number) =>
    apiClient.get<{ data: User }>(`/users/${id}`),

  create:  (payload: UserPayload) =>
    apiClient.post<{ data: User }>('/users', payload),

  update:  (id: number, payload: Partial<UserPayload>) =>
    apiClient.put<{ data: User }>(`/users/${id}`, payload),

  destroy: (id: number) =>
    apiClient.delete(`/users/${id}`),
}
