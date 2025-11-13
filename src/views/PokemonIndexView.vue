<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import PokemonCard from '@/components/PokemonCard.vue'
import { useFiltersStore } from '@/stores/filters'
import { usePokemonStore } from '@/stores/pokemon'

const pokemonStore = usePokemonStore()
const filtersStore = useFiltersStore()

const TYPE_OPTIONS = [
  'bug',
  'dark',
  'dragon',
  'electric',
  'fairy',
  'fighting',
  'fire',
  'flying',
  'ghost',
  'grass',
  'ground',
  'ice',
  'normal',
  'poison',
  'psychic',
  'rock',
  'steel',
  'water',
]

const GENERATION_RANGES: Record<string, [number, number]> = {
  'generation-i': [1, 151],
  'generation-ii': [152, 251],
  'generation-iii': [252, 386],
  'generation-iv': [387, 493],
  'generation-v': [494, 649],
  'generation-vi': [650, 721],
  'generation-vii': [722, 809],
  'generation-viii': [810, 905],
}

const GENERATION_OPTIONS = Object.keys(GENERATION_RANGES)

const pagination = computed(() => filtersStore.pagination)
const listCacheKey = computed(
  () => `list:limit:${pagination.value.limit}|offset:${pagination.value.offset}`,
)

const paginatedResponse = computed(
  () => pokemonStore.getListByKey(listCacheKey.value)?.results ?? null,
)
const paginatedResources = computed(() => paginatedResponse.value?.results ?? [])
const listStatus = computed(() => pokemonStore.getStatus(listCacheKey.value))

const searchQuery = computed({
  get: () => filtersStore.searchQuery,
  set: (value: string) => filtersStore.setSearchQuery(value),
})

const selectedTypes = computed(() => filtersStore.selectedTypes)
const selectedGenerations = computed(
  () => filtersStore.selectedGenerations as Array<keyof typeof GENERATION_RANGES>,
)
const hasTypeFilter = computed(() => selectedTypes.value.length > 0)
const typeFilteredResources = ref<Array<{ name: string; url: string }> | null>(null)
const typeLoading = ref(false)

const generationFilter = computed({
  get: () => selectedGenerations.value[0] ?? '',
  set: (value: string) => {
    filtersStore.setGenerations(value ? [value as keyof typeof GENERATION_RANGES] : [])
  },
})

const resourcePool = computed(() => {
  if (typeFilteredResources.value) {
    return typeFilteredResources.value
  }
  return paginatedResources.value
})

async function hydrateTypeFilters(types: string[]) {
  if (!types.length) {
    typeFilteredResources.value = null
    return
  }
  typeLoading.value = true
  try {
    const typePayloads = await Promise.all(types.map((type) => pokemonStore.ensureType(type)))
    const intersected = typePayloads.reduce<Map<string, string> | null>((acc, type) => {
      const currentMap = new Map<string, string>()
      type.pokemon.forEach((record) => {
        currentMap.set(record.pokemon.name, record.pokemon.url)
      })
      if (!acc) {
        return currentMap
      }
      const next = new Map<string, string>()
      currentMap.forEach((url, name) => {
        if (acc.has(name)) {
          next.set(name, url)
        }
      })
      return next
    }, null)

    typeFilteredResources.value = intersected
      ? Array.from(intersected.entries()).map(([name, url]) => ({ name, url }))
      : []
  } finally {
    typeLoading.value = false
  }
}

async function hydrateList() {
  await pokemonStore.fetchPokemonList({
    limit: pagination.value.limit,
    offset: pagination.value.offset,
  })
}

function changePage(direction: 'next' | 'prev') {
  const { limit, offset } = pagination.value
  const nextOffset = direction === 'next' ? offset + limit : Math.max(0, offset - limit)
  filtersStore.setPagination({ offset: nextOffset })
}

function extractId(resourceUrl: string) {
  const segments = resourceUrl.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
}

const filteredResults = computed(() => {
  const base = resourcePool.value
  const query = searchQuery.value.trim().toLowerCase()

  return base
    .filter((pokemon) => {
      const id = extractId(pokemon.url)
      if (query && !pokemon.name.includes(query)) {
        return false
      }
      if (selectedGenerations.value.length) {
        const matchesGeneration = selectedGenerations.value.some((generation) => {
          const range = generation ? GENERATION_RANGES[generation] : undefined
          if (!range) return true
          return id >= range[0] && id <= range[1]
        })
        if (!matchesGeneration) {
          return false
        }
      }
      return true
    })
    .slice(0, 60)
})

const visibleRangeLabel = computed(() => {
  if (typeFilteredResources.value) {
    return `Showing ${filteredResults.value.length} Pokémon`
  }
  const start = paginatedResources.value.length ? pagination.value.offset + 1 : 0
  const end = pagination.value.offset + paginatedResources.value.length
  const total = paginatedResponse.value?.count ?? '—'
  if (!start && !end) {
    return 'Waiting for Pokédex data…'
  }
  return `Showing ${start}-${end} of ${total}`
})

watch(
  selectedTypes,
  (types) => {
    hydrateTypeFilters(types)
  },
  { immediate: true },
)

watch(selectedGenerations, (generations, previous) => {
  if (!generations.length) {
    if (previous?.length) {
      filtersStore.setPagination({ offset: 0 })
    }
    return
  }
  const activeGeneration = generations[0]
  if (!activeGeneration) {
    return
  }
  const range = GENERATION_RANGES[activeGeneration]
  if (!range) return
  const desiredOffset = Math.max(0, range[0] - 1)
  if (pagination.value.offset !== desiredOffset) {
    filtersStore.setPagination({ offset: desiredOffset })
  } else if (!paginatedResponse.value) {
    hydrateList()
  }
})

watch(
  () => [pagination.value.limit, pagination.value.offset],
  () => {
    hydrateList()
  },
  { immediate: true },
)
</script>

<template>
  <section class="index-view">
    <div class="index-view__header">
      <div>
        <p class="eyebrow">Pokémon Index</p>
        <h1>Browse every Pokémon</h1>
        <p class="subhead">Search, filter by type, and page through the full Pokédex.</p>
      </div>
      <div class="search-input">
        <label for="pokemon-search">Search</label>
        <input
          id="pokemon-search"
          v-model="searchQuery"
          type="search"
          placeholder="Search by name"
        />
      </div>
    </div>

    <div class="filters">
      <div>
        <p class="filters__label">Filter by type</p>
        <div class="filters__types">
          <label v-for="type in TYPE_OPTIONS" :key="type">
            <input
              type="checkbox"
              :value="type"
              :checked="selectedTypes.includes(type)"
              @change="filtersStore.toggleType(type)"
            />
            <span>{{ type }}</span>
          </label>
        </div>
      </div>

      <div class="generation-filter">
        <label for="generation-select">Generation</label>
        <select id="generation-select" v-model="generationFilter">
          <option value="">Any</option>
          <option v-for="generation in GENERATION_OPTIONS" :key="generation" :value="generation">
            {{ generation }}
          </option>
        </select>
      </div>
    </div>

    <div class="index-view__status">
      <p v-if="listStatus.isLoading" class="status">Loading Pokémon…</p>
      <p v-else-if="listStatus.hasError" class="status status--error">
        {{ listStatus.errorMessage }}
      </p>
      <p v-else-if="typeLoading" class="status">Filtering by type…</p>
      <p v-else class="status status--muted">{{ visibleRangeLabel }}</p>
    </div>

    <ul v-if="filteredResults.length" class="pokemon-grid">
      <li v-for="resource in filteredResults" :key="resource.name">
        <PokemonCard :id="extractId(resource.url)" :name="resource.name" />
      </li>
    </ul>
    <p v-else class="status">No Pokémon match that query.</p>

    <div class="pagination">
      <button
        type="button"
        :disabled="pagination.offset === 0 || hasTypeFilter"
        @click="changePage('prev')"
      >
        Previous
      </button>
      <span>{{ visibleRangeLabel }}</span>
      <button type="button" :disabled="hasTypeFilter" @click="changePage('next')">Next</button>
    </div>
    <p v-if="hasTypeFilter" class="pagination-note">
      Pagination is disabled while filtering by type. Refine the filter or clear it to browse
      sequentially.
    </p>
  </section>
</template>

<style scoped>
.index-view {
  padding: 2rem 1.5rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.index-view__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 1.5rem;
}

.search-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.search-input input {
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5f5;
  min-width: 240px;
}

.filters {
  border: 1px solid #e2e8f0;
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.filters__label {
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.filters__types {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.5rem;
}

.filters__types label {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  text-transform: capitalize;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}

.status {
  text-align: center;
  color: #475569;
}

.status--error {
  color: #dc2626;
}

.status--muted {
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: center;
  gap: 1rem;
  align-items: center;
}

.pagination button {
  padding: 0.5rem 1.25rem;
  border-radius: 999px;
  border: 1px solid #e2e8f0;
  background: #fff;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-note {
  text-align: center;
  color: #94a3b8;
  font-size: 0.9rem;
}

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
  font-size: 0.85rem;
}

h1 {
  margin: 0.25rem 0;
  font-size: clamp(2rem, 5vw, 2.5rem);
  color: #0f172a;
}

.subhead {
  color: #475569;
}

.generation-filter {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 240px;
}

.generation-filter select {
  padding: 0.5rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5f5;
}
</style>
