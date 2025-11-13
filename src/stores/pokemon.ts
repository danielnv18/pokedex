import { defineStore } from 'pinia'

import type {
  EvolutionChain,
  FetchStatusMeta,
  Pokemon,
  PokemonSpecies,
  PokemonType,
} from '@/lib/types'
import {
  ApiError,
  fetchEvolutionChain,
  fetchPokemon,
  fetchPokemonList,
  fetchPokemonSpecies,
  fetchPokemonType,
  type PaginatedResult,
} from '@/lib/api-client'

interface PokemonListState {
  paramsKey: string
  results: PaginatedResult<{ name: string; url: string }>
}

interface PokemonStoreState {
  pokemonById: Record<number, Pokemon>
  pokemonNameToId: Record<string, number>
  speciesById: Record<number, PokemonSpecies>
  typesByName: Record<string, PokemonType>
  evolutionChainsById: Record<number, EvolutionChain>
  lists: Record<string, PokemonListState>
  status: Record<string, FetchStatusMeta>
}

function createStatus(): FetchStatusMeta {
  return {
    isLoading: false,
    hasError: false,
    errorMessage: null,
    updatedAt: null,
  }
}

function buildStatusKey(resource: string, identifier: string | number) {
  return `${resource}:${String(identifier).toLowerCase()}`
}

function stableParamsKey(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|')
}

export const usePokemonStore = defineStore('pokemon', {
  state: (): PokemonStoreState => ({
    pokemonById: {},
    pokemonNameToId: {},
    speciesById: {},
    typesByName: {},
    evolutionChainsById: {},
    lists: {},
    status: {},
  }),
  getters: {
    getPokemonById: (state) => (id: number) => state.pokemonById[id] ?? null,
    getPokemonByName: (state) => (name: string) => {
      const id = state.pokemonNameToId[name.toLowerCase()]
      return typeof id === 'number' ? (state.pokemonById[id] ?? null) : null
    },
    getSpeciesById: (state) => (id: number) => state.speciesById[id] ?? null,
    getTypeByName: (state) => (name: string) => state.typesByName[name.toLowerCase()] ?? null,
    getEvolutionChainById: (state) => (id: number) => state.evolutionChainsById[id] ?? null,
    getListByKey: (state) => (key: string) => state.lists[key] ?? null,
    getStatus: (state) => (key: string) => state.status[key] ?? createStatus(),
  },
  actions: {
    async ensurePokemon(identifier: number | string) {
      const cached =
        typeof identifier === 'number'
          ? this.pokemonById[identifier]
          : this.getPokemonByName(identifier)
      if (cached) {
        return cached
      }

      const statusKey = buildStatusKey('pokemon', identifier)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const pokemon = await fetchPokemon(identifier)
        this.pokemonById[pokemon.id] = pokemon
        this.pokemonNameToId[pokemon.name.toLowerCase()] = pokemon.id
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return pokemon
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load Pokémon'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureSpecies(identifier: number | string) {
      const key =
        typeof identifier === 'number'
          ? identifier
          : Number(this.pokemonNameToId[identifier.toLowerCase()])
      if (typeof key === 'number' && this.speciesById[key]) {
        return this.speciesById[key]
      }

      const statusKey = buildStatusKey('species', identifier)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const species = await fetchPokemonSpecies(identifier)
        this.speciesById[species.id] = species
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return species
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load species'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureType(identifier: number | string) {
      const key = typeof identifier === 'number' ? String(identifier) : identifier.toLowerCase()
      if (this.typesByName[key]) {
        return this.typesByName[key]
      }

      const statusKey = buildStatusKey('type', identifier)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const type = await fetchPokemonType(identifier)
        this.typesByName[type.name.toLowerCase()] = type
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return type
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load type'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureEvolutionChain(identifier: number | string) {
      const key = typeof identifier === 'number' ? identifier : Number(identifier)
      if (!Number.isNaN(key) && this.evolutionChainsById[key]) {
        return this.evolutionChainsById[key]
      }

      const statusKey = buildStatusKey('evolution-chain', identifier)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const chain = await fetchEvolutionChain(identifier)
        this.evolutionChainsById[chain.id] = chain
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return chain
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load evolution chain'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async fetchPokemonList(params: { limit?: number; offset?: number } = {}) {
      const normalized = {
        limit: typeof params.limit === 'number' ? String(params.limit) : '20',
        offset: typeof params.offset === 'number' ? String(params.offset) : '0',
      }
      const key = stableParamsKey(normalized)
      const cacheKey = `list:${key}`
      if (this.lists[cacheKey]) {
        return this.lists[cacheKey]
      }

      this.status[cacheKey] = { ...createStatus(), isLoading: true }
      try {
        const results = await fetchPokemonList({
          limit: Number(normalized.limit),
          offset: Number(normalized.offset),
        })
        this.lists[cacheKey] = {
          paramsKey: key,
          results,
        }
        this.status[cacheKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return this.lists[cacheKey]
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load Pokémon list'
        this.status[cacheKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
  },
})
