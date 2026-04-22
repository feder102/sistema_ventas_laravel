import { create } from 'zustand'

interface OnlineState {
  isOnline:     boolean
  pendingCount: number
  setOnline:    (v: boolean) => void
  setPending:   (n: number) => void
}

export const useOnlineStore = create<OnlineState>((set) => ({
  isOnline:     navigator.onLine,
  pendingCount: 0,
  setOnline:    (v) => set({ isOnline: v }),
  setPending:   (n) => set({ pendingCount: n }),
}))
