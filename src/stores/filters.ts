import { defineStore } from 'pinia'

type SortField = 'id' | 'name' | 'base_experience'
type SortDirection = 'asc' | 'desc'

interface PaginationState {
  limit: number
  offset: number
}

interface FiltersState {
  searchQuery: string
  selectedTypes: string[]
  selectedGenerations: string[]
  selectedHabitats: string[]
  sortField: SortField
  sortDirection: SortDirection
  pagination: PaginationState
  lastAppliedSnapshot: string
}

function createDefaultState(): FiltersState {
  const state: FiltersState = {
    searchQuery: '',
    selectedTypes: [],
    selectedGenerations: [],
    selectedHabitats: [],
    sortField: 'id',
    sortDirection: 'asc',
    pagination: { limit: 20, offset: 0 },
    lastAppliedSnapshot: '',
  }
  state.lastAppliedSnapshot = snapshotState(state)
  return state
}

function snapshotState(state: FiltersState): string {
  const payload = {
    searchQuery: state.searchQuery.trim().toLowerCase(),
    types: [...state.selectedTypes].sort(),
    generations: [...state.selectedGenerations].sort(),
    habitats: [...state.selectedHabitats].sort(),
    sortField: state.sortField,
    sortDirection: state.sortDirection,
    limit: state.pagination.limit,
    offset: state.pagination.offset,
  }
  return JSON.stringify(payload)
}

export const useFiltersStore = defineStore('filters', {
  state: createDefaultState,
  getters: {
    activeFiltersCount(state) {
      return (
        Number(Boolean(state.searchQuery.trim())) +
        state.selectedTypes.length +
        state.selectedGenerations.length +
        state.selectedHabitats.length
      )
    },
    queryParams(state) {
      return {
        search: state.searchQuery.trim() || undefined,
        types: state.selectedTypes,
        generations: state.selectedGenerations,
        habitats: state.selectedHabitats,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        limit: state.pagination.limit,
        offset: state.pagination.offset,
      }
    },
    isDirty(state) {
      return state.lastAppliedSnapshot !== snapshotState(state)
    },
  },
  actions: {
    setSearchQuery(query: string) {
      this.searchQuery = query
      this.resetOffset()
    },
    setTypes(types: string[]) {
      this.selectedTypes = types.map((type) => type.toLowerCase())
      this.resetOffset()
    },
    toggleType(typeName: string) {
      const normalized = typeName.toLowerCase()
      if (this.selectedTypes.includes(normalized)) {
        this.selectedTypes = this.selectedTypes.filter((value) => value !== normalized)
      } else {
        this.selectedTypes = [...this.selectedTypes, normalized]
      }
      this.resetOffset()
    },
    setGenerations(generations: string[]) {
      this.selectedGenerations = generations.map((generation) => generation.toLowerCase())
      this.resetOffset()
    },
    setHabitats(habitats: string[]) {
      this.selectedHabitats = habitats.map((habitat) => habitat.toLowerCase())
      this.resetOffset()
    },
    setSort(field: SortField, direction: SortDirection = 'asc') {
      this.sortField = field
      this.sortDirection = direction
      this.resetOffset()
    },
    setPagination(pagination: Partial<PaginationState>) {
      this.pagination = { ...this.pagination, ...pagination }
    },
    resetFilters() {
      this.searchQuery = ''
      this.selectedTypes = []
      this.selectedGenerations = []
      this.selectedHabitats = []
      this.sortField = 'id'
      this.sortDirection = 'asc'
      this.pagination = { limit: 20, offset: 0 }
    },
    resetOffset() {
      this.pagination = { ...this.pagination, offset: 0 }
    },
    markApplied() {
      this.lastAppliedSnapshot = snapshotState(this)
    },
  },
})
