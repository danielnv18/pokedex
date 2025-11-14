import { defineStore } from 'pinia'

import type {
  EvolutionChain,
  FetchStatusMeta,
  Pokemon,
  PokemonEncounterArea,
  PokemonSpecies,
  PokemonType,
} from '@/lib/types'
import {
  ApiError,
  fetchEvolutionChain,
  fetchPokemon,
  fetchPokemonList,
  fetchPokemonSpecies,
  fetchPokemonEncounters,
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
  encountersByPokemonId: Record<number, PokemonEncounterArea[]>
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

function normalizeIdentifier(identifier: number | string): number | string {
  if (typeof identifier === 'string') {
    const maybeNumber = Number(identifier)
    if (!Number.isNaN(maybeNumber) && identifier.trim() !== '') {
      return maybeNumber
    }
    return identifier.toLowerCase()
  }
  return identifier
}

export const usePokemonStore = defineStore('pokemon', {
  state: (): PokemonStoreState => ({
    pokemonById: {},
    pokemonNameToId: {},
    speciesById: {},
    typesByName: {},
    evolutionChainsById: {},
    encountersByPokemonId: {},
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
    getEncountersByPokemonId: (state) => (id: number) => state.encountersByPokemonId[id] ?? null,
    getListByKey: (state) => (key: string) => state.lists[key] ?? null,
    getStatus: (state) => (key: string) => state.status[key] ?? createStatus(),
  },
  actions: {
    async ensurePokemon(identifier: number | string) {
      const normalized = normalizeIdentifier(identifier)
      const cached =
        typeof normalized === 'number'
          ? this.pokemonById[normalized]
          : this.getPokemonByName(normalized)
      if (cached) {
        return cached
      }

      const statusKey = buildStatusKey('pokemon', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const pokemon = await fetchPokemon(normalized)
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
      const normalized = normalizeIdentifier(identifier)
      const key =
        typeof normalized === 'number'
          ? normalized
          : this.pokemonNameToId[String(normalized).toLowerCase()]
      if (typeof key === 'number' && this.speciesById[key]) {
        return this.speciesById[key]
      }

      const statusKey = buildStatusKey('species', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const species = await fetchPokemonSpecies(normalized)
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
      const normalized = normalizeIdentifier(identifier)
      const key = typeof normalized === 'number' ? String(normalized) : normalized
      if (this.typesByName[key]) {
        return this.typesByName[key]
      }

      const statusKey = buildStatusKey('type', key)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const type = await fetchPokemonType(normalized)
        this.typesByName[type.name.toLowerCase()] = type
        this.typesByName[String(type.id)] = type
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
      const normalized = normalizeIdentifier(identifier)
      const key = typeof normalized === 'number' ? normalized : Number(normalized)
      if (!Number.isNaN(key) && this.evolutionChainsById[key]) {
        return this.evolutionChainsById[key]
      }

      const statusKey = buildStatusKey('evolution-chain', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const chain = await fetchEvolutionChain(normalized)
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
    async ensurePokemonEncounters(identifier: number | string, endpoint?: string) {
      const normalized = normalizeIdentifier(identifier)
      let resolvedId: number | null =
        typeof normalized === 'number'
          ? normalized
          : (this.pokemonNameToId[String(normalized).toLowerCase()] ?? null)
      if (resolvedId === null) {
        const pokemon = await this.ensurePokemon(normalized)
        resolvedId = pokemon.id
      }
      if (typeof resolvedId !== 'number') {
        throw new Error('Unable to resolve Pokémon id for encounters')
      }
      const cached = this.encountersByPokemonId[resolvedId]
      if (cached) {
        return cached
      }

      const statusKey = buildStatusKey('encounters', resolvedId)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const target = endpoint ?? resolvedId
        const encounters = await fetchPokemonEncounters(target)
        this.encountersByPokemonId[resolvedId] = encounters
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return encounters
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load encounter data'
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
