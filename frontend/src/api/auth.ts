import type { User } from '../types'
import apiClient from './client'

export interface LoginPayload {
  email: string
  password: string
  remember?: boolean
}

export interface LoginResponse {
  data: {
    token: string
    token_type: string
    user: User
  }
}

export const authApi = {
  login:  (payload: LoginPayload) =>
    apiClient.post<LoginResponse>('/auth/login', payload),

  logout: () =>
    apiClient.post('/auth/logout'),

  me:     () =>
    apiClient.get<{ data: User }>('/auth/me'),
}
