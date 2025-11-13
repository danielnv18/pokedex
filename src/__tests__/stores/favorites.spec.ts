import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useFavoritesStore } from '@/stores/favorites'

describe('useFavoritesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockReturnValue('[]')
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(() => undefined)
  })

  it('toggles favorites and persists to storage', () => {
    const store = useFavoritesStore()
    store.hydrate()
    expect(store.ids).toHaveLength(0)
    store.toggle(25)
    expect(store.ids).toContain(25)
    store.toggle(25)
    expect(store.ids).not.toContain(25)
  })
})
