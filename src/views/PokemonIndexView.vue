<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onClickOutside } from '@vueuse/core'

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
const isTypeMenuOpen = ref(false)
const typeMenuRef = ref<HTMLElement | null>(null)
const typeMenuButtonRef = ref<HTMLButtonElement | null>(null)

const generationFilter = computed({
  get: () => selectedGenerations.value[0] ?? '',
  set: (value: string) => {
    filtersStore.setGenerations(value ? [value as keyof typeof GENERATION_RANGES] : [])
  },
})

onClickOutside(
  typeMenuRef,
  () => {
    isTypeMenuOpen.value = false
  },
  { ignore: [typeMenuButtonRef] },
)

const typeSummaryLabel = computed(() => {
  const summary = selectedTypes.value.map(formatTypeLabel)
  if (!summary.length) {
    return 'Any type'
  }
  if (summary.length <= 2) {
    return summary.join(', ')
  }
  return `${summary.slice(0, 2).join(', ')} +${summary.length - 2}`
})

function toggleTypeMenu() {
  isTypeMenuOpen.value = !isTypeMenuOpen.value
}

function clearTypeFilters() {
  if (selectedTypes.value.length) {
    filtersStore.setTypes([])
  }
  isTypeMenuOpen.value = false
}

function formatTypeLabel(type: string) {
  return type.charAt(0).toUpperCase() + type.slice(1)
}

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
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <div
      class="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
          Pokémon Index
        </p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">Browse every Pokémon</h1>
        <p class="mt-2 text-sm text-slate-600">
          Search, filter by type, and page through the full Pokédex pulled live from PokéAPI.
        </p>
      </div>
      <label class="w-full sm:max-w-xs">
        <span class="text-sm font-medium text-slate-600">Search</span>
        <input
          id="pokemon-search"
          v-model="searchQuery"
          type="search"
          placeholder="Search by name (pikachu)"
          class="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
      </label>
    </div>

    <div class="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px] lg:items-start">
        <div class="min-w-56 lg:flex-1">
          <label class="text-sm font-semibold text-slate-700">Type</label>
          <div class="relative mt-2" data-testid="type-filter">
            <button
              ref="typeMenuButtonRef"
              type="button"
              class="flex h-12 w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
              :aria-expanded="isTypeMenuOpen"
              aria-haspopup="listbox"
              aria-controls="type-filter-popover"
              @click="toggleTypeMenu"
            >
              <span class="truncate">{{ typeSummaryLabel }}</span>
              <span class="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-slate-400">
                Types
                <svg
                  class="size-3.5 transition"
                  :class="{ 'rotate-180': isTypeMenuOpen }"
                  viewBox="0 0 20 20"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 8l5 5 5-5"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
            </button>
            <Transition
              enter-active-class="transition duration-150 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-100 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div
                v-if="isTypeMenuOpen"
                id="type-filter-popover"
                ref="typeMenuRef"
                tabindex="-1"
                class="absolute left-0 top-full z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5"
                role="listbox"
                aria-multiselectable="true"
                @keydown.esc.stop.prevent="isTypeMenuOpen = false"
              >
                <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <p class="text-sm font-semibold text-slate-700">Select types</p>
                  <button
                    type="button"
                    class="text-xs font-semibold text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
                    :disabled="!selectedTypes.length"
                    @click="clearTypeFilters"
                  >
                    Clear
                  </button>
                </div>
                <div class="max-h-72 overflow-y-auto px-4 py-3">
                  <div class="grid grid-cols-2 gap-2">
                    <label
                      v-for="type in TYPE_OPTIONS"
                      :key="type"
                      class="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300"
                    >
                      <input
                        type="checkbox"
                        :value="type"
                        :checked="selectedTypes.includes(type)"
                        class="size-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
                        @change="filtersStore.toggleType(type)"
                      />
                      <span class="capitalize">{{ type }}</span>
                    </label>
                  </div>
                </div>
                <p class="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
                  Selecting multiple types intersects the results so only Pokémon that match every
                  type remain.
                </p>
              </div>
            </Transition>
          </div>
        </div>
        <div class="w-full min-w-48">
          <label for="generation-select" class="text-sm font-semibold text-slate-700">
            Generation
          </label>
          <div class="relative mt-2">
            <select
              id="generation-select"
              v-model="generationFilter"
              class="flex h-12 w-full appearance-none items-center rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            >
              <option value="">Any</option>
              <option
                v-for="generation in GENERATION_OPTIONS"
                :key="generation"
                :value="generation"
              >
                {{ generation }}
              </option>
            </select>
            <span
              aria-hidden="true"
              class="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-slate-400"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M6 8l4 4 4-4"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div
        v-if="selectedTypes.length"
        class="flex flex-wrap gap-2"
        aria-label="Selected types"
      >
        <button
          v-for="type in selectedTypes"
          :key="type"
          type="button"
          class="group inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700 shadow-sm transition hover:border-red-200 hover:text-red-500"
          @click="filtersStore.toggleType(type)"
        >
          {{ formatTypeLabel(type) }}
          <span
            aria-hidden="true"
            class="text-slate-400 transition group-hover:text-red-400"
          >
            &times;
          </span>
        </button>
      </div>
    </div>

    <div
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-3 text-center text-sm"
    >
      <p v-if="listStatus.isLoading" class="text-slate-600">Loading Pokémon…</p>
      <p v-else-if="listStatus.hasError" class="font-semibold text-red-500">
        {{ listStatus.errorMessage }}
      </p>
      <p v-else-if="typeLoading" class="text-slate-600">Filtering by type…</p>
      <p v-else class="text-slate-500">{{ visibleRangeLabel }}</p>
    </div>

    <ul
      v-if="filteredResults.length"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-live="polite"
    >
      <li v-for="resource in filteredResults" :key="resource.name">
        <PokemonCard :id="extractId(resource.url)" :name="resource.name" />
      </li>
    </ul>
    <p v-else class="text-center text-slate-500">No Pokémon match that query.</p>

    <div class="flex flex-wrap items-center justify-center gap-4">
      <button
        type="button"
        class="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="pagination.offset === 0 || hasTypeFilter"
        @click="changePage('prev')"
      >
        Previous
      </button>
      <span class="text-sm text-slate-500">{{ visibleRangeLabel }}</span>
      <button
        type="button"
        class="rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="hasTypeFilter"
        @click="changePage('next')"
      >
        Next
      </button>
    </div>
    <p v-if="hasTypeFilter" class="text-center text-sm text-slate-500">
      Pagination is disabled while filtering by type. Refine or clear the selection to browse
      sequentially.
    </p>
  </section>
</template>
