import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useUiStore } from '@/stores/ui'

describe('useUiStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('toggle command palette', () => {
    const store = useUiStore()
    expect(store.isCommandPaletteOpen).toBe(false)
    store.toggleCommandPalette()
    expect(store.isCommandPaletteOpen).toBe(true)
    store.toggleCommandPalette(false)
    expect(store.isCommandPaletteOpen).toBe(false)
  })

  it('manages toast queue', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const store = useUiStore()
    const id = store.showToast({ title: 'Saved', variant: 'success' })
    expect(store.toasts).toHaveLength(1)
    expect(id).toBe(store.toasts[0].id)

    store.dismissToast(id)
    expect(store.toasts).toHaveLength(0)
  })
})
