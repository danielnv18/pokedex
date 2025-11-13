import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePokemonStore } from '@/stores/pokemon'
import type { Pokemon, PokemonSpecies, PokemonType } from '@/lib/types'

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

const SAMPLE_SPECIES: PokemonSpecies = {
  id: 1,
  name: 'bulbasaur',
  order: 1,
  gender_rate: 1,
  capture_rate: 45,
  base_happiness: 50,
  is_baby: false,
  is_legendary: false,
  is_mythical: false,
  hatch_counter: 20,
  has_gender_differences: false,
  forms_switchable: false,
  growth_rate: { name: 'medium', url: 'https://pokeapi.co/api/v2/growth-rate/2/' },
  pokedex_numbers: [],
  egg_groups: [],
  color: { name: 'green', url: 'https://pokeapi.co/api/v2/pokemon-color/5/' },
  shape: { name: 'quadruped', url: 'https://pokeapi.co/api/v2/pokemon-shape/8/' },
  evolves_from_species: null,
  evolution_chain: { url: 'https://pokeapi.co/api/v2/evolution-chain/1/' },
  habitat: null,
  generation: { name: 'generation-i', url: 'https://pokeapi.co/api/v2/generation/1/' },
  names: [],
  flavor_text_entries: [],
  form_descriptions: [],
  genera: [],
  varieties: [],
}

const SAMPLE_TYPE: PokemonType = {
  id: 1,
  name: 'normal',
  damage_relations: {
    double_damage_from: [],
    double_damage_to: [],
    half_damage_from: [],
    half_damage_to: [],
    no_damage_from: [],
    no_damage_to: [],
  },
  past_damage_relations: [],
  game_indices: [],
  generation: { name: 'generation-i', url: 'https://pokeapi.co/api/v2/generation/1/' },
  move_damage_class: { name: 'physical', url: 'https://pokeapi.co/api/v2/move-damage-class/2/' },
  names: [],
  pokemon: [],
  moves: [],
}

const okResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('usePokemonStore', () => {
  function createFetchMock() {
    return vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.url
      if (url.includes('/pokemon-species/')) {
        return okResponse(SAMPLE_SPECIES)
      }
      if (url.includes('/type/')) {
        return okResponse(SAMPLE_TYPE)
      }
      return okResponse(SAMPLE_POKEMON)
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', createFetchMock())
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

  it('reuses cached species when identifier is numeric string', async () => {
    const store = usePokemonStore()
    const first = await store.ensureSpecies('1')
    expect(first.id).toBe(1)

    const fetchMock = vi.mocked(fetch)
    const callsAfterFirst = fetchMock.mock.calls.length

    const second = await store.ensureSpecies('1')
    expect(second).toStrictEqual(first)
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })

  it('reuses cached type when identifier is numeric string', async () => {
    const store = usePokemonStore()
    const first = await store.ensureType('1')
    expect(first.id).toBe(1)

    const fetchMock = vi.mocked(fetch)
    const callsAfterFirst = fetchMock.mock.calls.length

    const second = await store.ensureType('1')
    expect(second).toStrictEqual(first)
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst)
  })
})
