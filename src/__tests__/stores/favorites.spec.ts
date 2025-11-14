import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useFavoritesStore } from '@/stores/favorites'

describe('useFavoritesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store: Record<string, string> = {}
    vi.spyOn(window.localStorage.__proto__, 'getItem').mockImplementation((key: string) => {
      return store[key] ?? null
    })
    vi.spyOn(window.localStorage.__proto__, 'setItem').mockImplementation(
      (key: string, value: string) => {
        store[key] = value
      },
    )
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

  it('manages team slots with add, swap, and clear operations', () => {
    const store = useFavoritesStore()
    store.hydrate()

    store.addToTeam(1)
    store.addToTeam(2)
    expect(store.teamSlots[0]).toBe(1)
    expect(store.teamSlots[1]).toBe(2)

    store.swapTeamSlots(0, 1)
    expect(store.teamSlots[0]).toBe(2)
    expect(store.teamSlots[1]).toBe(1)

    store.setTeamSlot(1, null)
    expect(store.teamSlots[1]).toBeNull()

    store.clearTeam()
    expect(store.teamSlots.every((slot) => slot === null)).toBe(true)
  })
})
