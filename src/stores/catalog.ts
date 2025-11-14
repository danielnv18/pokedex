import { defineStore } from 'pinia'

import type {
  Ability,
  FetchStatusMeta,
  Location,
  LocationArea,
  Move,
  NamedApiResource,
} from '@/lib/types'
import {
  ApiError,
  fetchAbility,
  fetchLocation,
  fetchLocationArea,
  fetchLocationList,
  fetchMove,
  fetchMoveList,
  type PaginatedResult,
} from '@/lib/api-client'

interface NamedListState {
  paramsKey: string
  results: PaginatedResult<NamedApiResource>
}

interface CatalogState {
  abilitiesByName: Record<string, Ability>
  movesByName: Record<string, Move>
  moveLists: Record<string, NamedListState>
  locationsById: Record<number, Location>
  locationAreasByName: Record<string, LocationArea>
  locationList: Record<string, NamedListState>
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

function normalizeIdentifier(identifier: string | number): string {
  return String(identifier).toLowerCase()
}

function stableParamsKey(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((key) => `${key}:${params[key]}`)
    .join('|')
}

export const useCatalogStore = defineStore('catalog', {
  state: (): CatalogState => ({
    abilitiesByName: {},
    movesByName: {},
    moveLists: {},
    locationsById: {},
    locationAreasByName: {},
    locationList: {},
    status: {},
  }),
  getters: {
    getAbility: (state) => (name: string) => state.abilitiesByName[name.toLowerCase()] ?? null,
    getMove: (state) => (name: string) => state.movesByName[name.toLowerCase()] ?? null,
    getMoveListByKey: (state) => (key: string) => state.moveLists[key] ?? null,
    getLocationById: (state) => (id: number) => state.locationsById[id] ?? null,
    getLocationArea: (state) => (name: string) =>
      state.locationAreasByName[name.toLowerCase()] ?? null,
    getLocationListByKey: (state) => (key: string) => state.locationList[key] ?? null,
    getStatus: (state) => (key: string) => state.status[key] ?? createStatus(),
  },
  actions: {
    async ensureAbility(identifier: string | number) {
      const normalized = normalizeIdentifier(identifier)
      const cached = this.abilitiesByName[normalized]
      if (cached) {
        return cached
      }
      const statusKey = buildStatusKey('ability', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const ability = await fetchAbility(identifier)
        this.abilitiesByName[ability.name.toLowerCase()] = ability
        this.abilitiesByName[String(ability.id)] = ability
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return ability
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load ability'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureMove(identifier: string | number) {
      const normalized = normalizeIdentifier(identifier)
      const cached = this.movesByName[normalized]
      if (cached) {
        return cached
      }
      const statusKey = buildStatusKey('move', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const move = await fetchMove(identifier)
        this.movesByName[move.name.toLowerCase()] = move
        this.movesByName[String(move.id)] = move
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return move
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load move'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async fetchMoveList(params: { limit?: number; offset?: number } = {}) {
      const normalized = {
        limit: typeof params.limit === 'number' ? String(params.limit) : '50',
        offset: typeof params.offset === 'number' ? String(params.offset) : '0',
      }
      const key = stableParamsKey(normalized)
      const cacheKey = `move-list:${key}`
      if (this.moveLists[cacheKey]) {
        return this.moveLists[cacheKey]
      }
      this.status[cacheKey] = { ...createStatus(), isLoading: true }
      try {
        const results = await fetchMoveList({
          limit: Number(normalized.limit),
          offset: Number(normalized.offset),
        })
        this.moveLists[cacheKey] = {
          paramsKey: key,
          results,
        }
        this.status[cacheKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return this.moveLists[cacheKey]
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load moves'
        this.status[cacheKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async fetchLocationList(params: { limit?: number; offset?: number } = {}) {
      const normalized = {
        limit: typeof params.limit === 'number' ? String(params.limit) : '20',
        offset: typeof params.offset === 'number' ? String(params.offset) : '0',
      }
      const key = stableParamsKey(normalized)
      const cacheKey = `location-list:${key}`
      if (this.locationList[cacheKey]) {
        return this.locationList[cacheKey]
      }
      this.status[cacheKey] = { ...createStatus(), isLoading: true }
      try {
        const results = await fetchLocationList({
          limit: Number(normalized.limit),
          offset: Number(normalized.offset),
        })
        this.locationList[cacheKey] = {
          paramsKey: key,
          results,
        }
        this.status[cacheKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return this.locationList[cacheKey]
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load locations'
        this.status[cacheKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureLocation(identifier: number | string) {
      const numericId = Number(identifier)
      if (!Number.isNaN(numericId) && this.locationsById[numericId]) {
        return this.locationsById[numericId]
      }
      const normalized = normalizeIdentifier(identifier)
      const statusKey = buildStatusKey('location', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const location = await fetchLocation(identifier)
        this.locationsById[location.id] = location
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return location
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load location'
        this.status[statusKey] = {
          isLoading: false,
          hasError: true,
          errorMessage: message,
          updatedAt: Date.now(),
        }
        throw error
      }
    },
    async ensureLocationArea(identifier: number | string) {
      const normalized = normalizeIdentifier(identifier)
      const cached = this.locationAreasByName[normalized]
      if (cached) {
        return cached
      }
      const statusKey = buildStatusKey('location-area', normalized)
      this.status[statusKey] = { ...createStatus(), isLoading: true }
      try {
        const area = await fetchLocationArea(identifier)
        this.locationAreasByName[area.name.toLowerCase()] = area
        this.locationAreasByName[String(area.id)] = area
        this.status[statusKey] = {
          isLoading: false,
          hasError: false,
          errorMessage: null,
          updatedAt: Date.now(),
        }
        return area
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load location area'
        this.status[statusKey] = {
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
