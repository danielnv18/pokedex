<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type { Move } from '@/lib/types'
import { useCatalogStore } from '@/stores/catalog'

const catalogStore = useCatalogStore()

const pagination = reactive({
  limit: 40,
  offset: 0,
})

const filters = reactive({
  search: '',
  type: '',
  damageClass: '',
  sortField: 'name' as 'name' | 'power' | 'accuracy' | 'pp',
  sortDirection: 'asc' as 'asc' | 'desc',
})

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

const moveListCacheKey = computed(
  () => `move-list:limit:${pagination.limit}|offset:${pagination.offset}`,
)
const moveListState = computed(() => catalogStore.getMoveListByKey(moveListCacheKey.value) ?? null)
const moveRecords = computed(() => moveListState.value?.results.results ?? [])
const listStatus = computed(() => catalogStore.getStatus(moveListCacheKey.value))

const ensuringMoves = ref(false)

watch(
  () => [pagination.limit, pagination.offset],
  async () => {
    await catalogStore.fetchMoveList({
      limit: pagination.limit,
      offset: pagination.offset,
    })
  },
  { immediate: true },
)

watch(
  () => moveRecords.value.map((record) => record.name),
  async (names) => {
    if (!names.length) return
    ensuringMoves.value = true
    try {
      await Promise.all(names.map((name) => catalogStore.ensureMove(name)))
    } finally {
      ensuringMoves.value = false
    }
  },
  { immediate: true },
)

const moveDetails = computed(() => {
  return moveRecords.value
    .map((record) => catalogStore.getMove(record.name))
    .filter((move): move is Move => Boolean(move))
})

const filteredMoves = computed(() => {
  return moveDetails.value
    .filter((move) => {
      const query = filters.search.trim().toLowerCase()
      if (query && !move.name.includes(query)) {
        return false
      }
      if (filters.type && move.type.name !== filters.type) {
        return false
      }
      if (filters.damageClass && move.damage_class.name !== filters.damageClass) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      const direction = filters.sortDirection === 'asc' ? 1 : -1
      if (filters.sortField === 'name') {
        return a.name.localeCompare(b.name) * direction
      }
      const aValue = a[filters.sortField] ?? 0
      const bValue = b[filters.sortField] ?? 0
      return (aValue - bValue) * direction
    })
})

const total = computed(() => moveListState.value?.results.count ?? 0)

function nextPage() {
  pagination.offset = Math.min(total.value, pagination.offset + pagination.limit)
}

function prevPage() {
  pagination.offset = Math.max(0, pagination.offset - pagination.limit)
}

function toggleSort(field: typeof filters.sortField) {
  if (filters.sortField === field) {
    filters.sortDirection = filters.sortDirection === 'asc' ? 'desc' : 'asc'
  } else {
    filters.sortField = field
    filters.sortDirection = 'desc'
  }
}
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <header class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Moves</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-900">Moves Explorer</h1>
      <p class="mt-2 text-sm text-slate-600">
        Browse competitive stats for {{ total }} moves pulled live from PokéAPI. Filter by type,
        damage class, and name to find the perfect coverage option.
      </p>
    </header>

    <form
      class="grid gap-4 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm md:grid-cols-4"
    >
      <label class="flex flex-col text-sm font-medium text-slate-600">
        Search
        <input
          v-model="filters.search"
          type="search"
          placeholder="thunderbolt"
          class="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        />
      </label>
      <label class="flex flex-col text-sm font-medium text-slate-600">
        Type
        <select
          v-model="filters.type"
          class="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        >
          <option value="">Any</option>
          <option v-for="type in TYPE_OPTIONS" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </label>
      <label class="flex flex-col text-sm font-medium text-slate-600">
        Damage class
        <select
          v-model="filters.damageClass"
          class="mt-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
        >
          <option value="">Any</option>
          <option value="physical">Physical</option>
          <option value="special">Special</option>
          <option value="status">Status</option>
        </select>
      </label>
      <div class="flex items-end justify-end gap-2">
        <button
          type="button"
          class="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          @click="
            () => {
              filters.search = ''
              filters.type = ''
              filters.damageClass = ''
              filters.sortField = 'name'
              filters.sortDirection = 'asc'
            }
          "
        >
          Reset
        </button>
      </div>
    </form>

    <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4 text-sm text-slate-500">
        <p>
          Showing {{ filteredMoves.length }} of
          {{ moveListState?.results.results.length ?? 0 }} moves on this page.
        </p>
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="pagination.offset === 0 || listStatus.isLoading"
            @click="prevPage"
          >
            Previous
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="pagination.offset + pagination.limit >= total || listStatus.isLoading"
            @click="nextPage"
          >
            Next
          </button>
        </div>
      </div>

      <div
        v-if="listStatus.isLoading || ensuringMoves"
        class="mt-6 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-slate-500"
      >
        Loading moves…
      </div>

      <div v-else-if="!filteredMoves.length" class="mt-6 text-center text-slate-500">
        No moves match that filter combination.
      </div>

      <div v-else class="mt-6 overflow-x-auto">
        <table class="w-full table-fixed text-left text-sm">
          <thead class="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="pb-3">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('name')">
                  Name
                  <span v-if="filters.sortField === 'name'">
                    {{ filters.sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </button>
              </th>
              <th class="pb-3">Type</th>
              <th class="pb-3">Class</th>
              <th class="pb-3 w-20">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('power')">
                  Power
                  <span v-if="filters.sortField === 'power'">
                    {{ filters.sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </button>
              </th>
              <th class="pb-3 w-24">
                <button
                  type="button"
                  class="flex items-center gap-1"
                  @click="toggleSort('accuracy')"
                >
                  Accuracy
                  <span v-if="filters.sortField === 'accuracy'">
                    {{ filters.sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </button>
              </th>
              <th class="pb-3 w-20">
                <button type="button" class="flex items-center gap-1" @click="toggleSort('pp')">
                  PP
                  <span v-if="filters.sortField === 'pp'">
                    {{ filters.sortDirection === 'asc' ? '↑' : '↓' }}
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="move in filteredMoves"
              :key="move.name"
              class="border-t border-slate-200 text-slate-700"
            >
              <td class="py-3 capitalize">{{ move.name.replace('-', ' ') }}</td>
              <td class="py-3 capitalize">{{ move.type.name }}</td>
              <td class="py-3 capitalize">{{ move.damage_class.name }}</td>
              <td class="py-3 font-semibold">{{ move.power ?? '—' }}</td>
              <td class="py-3 font-semibold">{{ move.accuracy ?? '—' }}</td>
              <td class="py-3 font-semibold">{{ move.pp ?? '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
