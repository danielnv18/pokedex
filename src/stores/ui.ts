import { defineStore } from 'pinia'

type ThemePreference = 'system' | 'light' | 'dark'
type LayoutDensity = 'comfortable' | 'compact'
type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  createdAt: number
  autoCloseMs?: number
}

interface UiState {
  theme: ThemePreference
  layoutDensity: LayoutDensity
  isCommandPaletteOpen: boolean
  isLoadingOverlayVisible: boolean
  toasts: ToastMessage[]
}

function createToastId() {
  return Math.random().toString(36).slice(2)
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    theme: 'system',
    layoutDensity: 'comfortable',
    isCommandPaletteOpen: false,
    isLoadingOverlayVisible: false,
    toasts: [],
  }),
  getters: {
    isDark(state) {
      if (state.theme === 'dark') return true
      if (state.theme === 'light') return false
      if (typeof window === 'undefined') {
        return false
      }
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
    },
  },
  actions: {
    setTheme(theme: ThemePreference) {
      this.theme = theme
    },
    toggleCommandPalette(force?: boolean) {
      this.isCommandPaletteOpen = typeof force === 'boolean' ? force : !this.isCommandPaletteOpen
    },
    setLayoutDensity(density: LayoutDensity) {
      this.layoutDensity = density
    },
    setLoadingOverlay(visible: boolean) {
      this.isLoadingOverlayVisible = visible
    },
    showToast(payload: Omit<ToastMessage, 'id' | 'createdAt'> & { id?: string }) {
      const toast: ToastMessage = {
        id: payload.id ?? createToastId(),
        title: payload.title,
        description: payload.description,
        variant: payload.variant ?? 'info',
        createdAt: Date.now(),
        autoCloseMs: payload.autoCloseMs,
      }
      this.toasts = [...this.toasts, toast]
      return toast.id
    },
    dismissToast(id: string) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id)
    },
    clearToasts() {
      this.toasts = []
    },
  },
})
