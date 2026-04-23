import { create } from 'zustand'
import { authApi } from '../api/auth'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login:   (email: string, password: string) => Promise<void>
  logout:  () => Promise<void>
  hydrate: () => void
}

function loadFromStorage(): Pick<AuthState, 'token' | 'user'> {
  const token = localStorage.getItem('pos_token')
  const raw   = localStorage.getItem('pos_user')
  if (token && raw) {
    try {
      return { token, user: JSON.parse(raw) as User }
    } catch {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
    }
  }
  return { token: null, user: null }
}

export const useAuthStore = create<AuthState>((set) => ({
  ...loadFromStorage(),
  isLoading: false,

  hydrate() {
    set(loadFromStorage())
  },

  async login(email, password) {
    set({ isLoading: true })
    try {
      const res   = await authApi.login({ email, password })
      const { token, user } = res.data.data
      localStorage.setItem('pos_token', token)
      localStorage.setItem('pos_user', JSON.stringify(user))
      set({ token, user, isLoading: false })
    } catch (err) {
      set({ isLoading: false })
      throw err
    }
  },

  async logout() {
    try {
      await authApi.logout()
    } finally {
      localStorage.removeItem('pos_token')
      localStorage.removeItem('pos_user')
      set({ token: null, user: null })
    }
  },
}))
