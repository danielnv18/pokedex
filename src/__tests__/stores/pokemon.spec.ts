import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePokemonStore } from '@/stores/pokemon'
import type { Pokemon } from '@/lib/types'

const SAMPLE_POKEMON: Pokemon = {
  id: 1,
  name: 'bulbasaur',
  base_experience: 64,
  height: 7,
  weight: 69,
  is_default: true,
  order: 1,
  abilities: [],
  forms: [],
  game_indices: [],
  held_items: [],
  location_area_encounters: '/api/v2/pokemon/1/encounters',
  moves: [],
  species: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
  sprites: {
    back_default: null,
    back_female: null,
    back_shiny: null,
    back_shiny_female: null,
    front_default: null,
    front_female: null,
    front_shiny: null,
    front_shiny_female: null,
  },
  stats: [],
  types: [],
  past_types: [],
  past_abilities: [],
}

const okResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('usePokemonStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn(async () => okResponse(SAMPLE_POKEMON)))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('reuses cached Pokémon when identifier is a numeric string', async () => {
    const store = usePokemonStore()

    const first = await store.ensurePokemon('1')
    expect(first.id).toBe(1)

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const second = await store.ensurePokemon('1')
    expect(second).toStrictEqual(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
