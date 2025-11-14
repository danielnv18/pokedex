import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import type { Ability, Move, NamedApiResource } from '@/lib/types'

vi.mock('@/lib/api-client', () => {
  return {
    fetchAbility: vi.fn(() =>
      Promise.resolve({
        id: 1,
        name: 'overgrow',
        generation: { name: 'generation-i', url: '' },
        effect_entries: [
          {
            effect: 'Boosts Grass moves.',
            short_effect: 'Boosts Grass moves.',
            language: { name: 'en', url: '' },
          },
        ],
        flavor_text_entries: [],
        pokemon: [],
      } satisfies Ability),
    ),
    fetchMove: vi.fn(() =>
      Promise.resolve({
        id: 10,
        name: 'ember',
        accuracy: 100,
        power: 40,
        pp: 25,
        priority: 0,
        type: { name: 'fire', url: '' },
        damage_class: { name: 'special', url: '' },
        effect_entries: [],
      } satisfies Move),
    ),
    fetchMoveList: vi.fn(() =>
      Promise.resolve({
        count: 1,
        next: null,
        previous: null,
        results: [{ name: 'ember', url: '/move/ember' }],
      } satisfies {
        count: number
        next: string | null
        previous: string | null
        results: NamedApiResource[]
      }),
    ),
    fetchLocationList: vi.fn(() =>
      Promise.resolve({
        count: 0,
        next: null,
        previous: null,
        results: [],
      } satisfies {
        count: number
        next: string | null
        previous: string | null
        results: NamedApiResource[]
      }),
    ),
  }
})

import { fetchAbility } from '@/lib/api-client'
import { useCatalogStore } from '@/stores/catalog'

describe('useCatalogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('caches abilities after fetching', async () => {
    const store = useCatalogStore()
    const ability = await store.ensureAbility('overgrow')
    expect(ability.name).toBe('overgrow')
    expect(store.getAbility('overgrow')).toBeTruthy()

    const second = await store.ensureAbility('overgrow')
    expect(second).toStrictEqual(ability)
    expect(fetchAbility).toHaveBeenCalledTimes(1)
  })

  it('fetches move list and ensures moves are cached', async () => {
    const store = useCatalogStore()
    const list = await store.fetchMoveList({ limit: 20, offset: 0 })
    expect(list.results.results).toHaveLength(1)

    const move = await store.ensureMove('ember')
    expect(move.name).toBe('ember')
    expect(store.getMove('ember')).toEqual(move)
  })
})
