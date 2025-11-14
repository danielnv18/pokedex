<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'

import type { Location, LocationArea } from '@/lib/types'
import { useCatalogStore } from '@/stores/catalog'

const catalogStore = useCatalogStore()

const pagination = reactive({
  limit: 12,
  offset: 0,
})

const viewMode = ref<'grid' | 'list'>('grid')
const selectedLocationName = ref<string | null>(null)
const selectedLocation = ref<Location | null>(null)
const locationError = ref<string | null>(null)
const isLocationLoading = ref(false)
const areaDetails = ref<Record<string, LocationArea>>({})

const locationListCacheKey = computed(
  () => `location-list:limit:${pagination.limit}|offset:${pagination.offset}`,
)
const locationListState = computed(
  () => catalogStore.getLocationListByKey(locationListCacheKey.value) ?? null,
)
const locationListStatus = computed(() => catalogStore.getStatus(locationListCacheKey.value))
const locations = computed(() => locationListState.value?.results.results ?? [])

watch(
  () => [pagination.limit, pagination.offset],
  async () => {
    await catalogStore.fetchLocationList({
      limit: pagination.limit,
      offset: pagination.offset,
    })
  },
  { immediate: true },
)

watch(
  () => locations.value,
  (records) => {
    const firstRecord = records?.[0]
    if (!firstRecord) return
    if (!selectedLocationName.value) {
      selectedLocationName.value = firstRecord.name
    }
  },
  { immediate: true },
)

async function loadLocation(name: string | null) {
  if (!name) return
  isLocationLoading.value = true
  locationError.value = null
  try {
    selectedLocation.value = await catalogStore.ensureLocation(name)
    areaDetails.value = {}
    prefetchAreas()
  } catch (error) {
    locationError.value = error instanceof Error ? error.message : 'Failed to load location'
  } finally {
    isLocationLoading.value = false
  }
}

watch(
  () => selectedLocationName.value,
  (name) => {
    loadLocation(name ?? null)
  },
  { immediate: true },
)

async function ensureAreaDetail(name: string) {
  if (areaDetails.value[name]) {
    return areaDetails.value[name]
  }
  try {
    const detail = await catalogStore.ensureLocationArea(name)
    areaDetails.value = {
      ...areaDetails.value,
      [name]: detail,
    }
    return detail
  } catch (error) {
    console.error('Failed to load area', error)
    return null
  }
}

function prefetchAreas() {
  const names = selectedLocation.value?.areas.slice(0, 3).map((area) => area.name) ?? []
  names.forEach((name) => {
    ensureAreaDetail(name)
  })
}

const selectedAreas = computed(() => selectedLocation.value?.areas ?? [])

function toggleView(mode: 'grid' | 'list') {
  viewMode.value = mode
}

function extractEncounterPreview(area: LocationArea | undefined) {
  if (!area) return []
  return area.pokemon_encounters.slice(0, 3).map((encounter) => encounter.pokemon.name)
}

function formatName(value: string) {
  return value.replace('-', ' ')
}
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <header class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Locations</p>
      <h1 class="mt-3 text-3xl font-semibold text-slate-900">Locations & Encounters</h1>
      <p class="mt-2 text-sm text-slate-600">
        Explore regions, cities, and encounter areas. Toggle between grid and list modes to plan
        your next capture route.
      </p>
    </header>

    <div class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="text-sm text-slate-500">
          Showing {{ locations.length }} of {{ locationListState?.results.count ?? 0 }} locations.
        </div>
        <div class="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-1.5"
            :class="viewMode === 'grid' ? 'bg-slate-100' : ''"
            @click="toggleView('grid')"
          >
            Grid
          </button>
          <button
            type="button"
            class="rounded-full border border-slate-200 px-4 py-1.5"
            :class="viewMode === 'list' ? 'bg-slate-100' : ''"
            @click="toggleView('list')"
          >
            List
          </button>
        </div>
      </div>

      <div class="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <button
          v-for="location in locations"
          :key="location.name"
          type="button"
          class="rounded-2xl border px-4 py-3 text-left text-sm font-semibold capitalize transition hover:border-sky-300"
          :class="
            selectedLocationName === location.name
              ? 'border-sky-400 bg-sky-50 text-sky-700'
              : 'border-slate-200 text-slate-700'
          "
          @click="selectedLocationName = location.name"
        >
          {{ formatName(location.name) }}
        </button>
      </div>
    </div>

    <div
      v-if="locationListStatus.isLoading || isLocationLoading"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-slate-500"
    >
      Loading location details…
    </div>
    <div
      v-else-if="locationError"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center font-semibold text-red-500"
    >
      {{ locationError }}
    </div>

    <div v-else-if="selectedLocation" class="space-y-6">
      <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Region</p>
            <h2 class="mt-2 text-2xl font-semibold capitalize text-slate-900">
              {{ selectedLocation.region?.name ?? 'Unknown region' }}
            </h2>
          </div>
          <div class="text-right text-sm text-slate-600">
            <p>Areas: {{ selectedAreas.length }}</p>
            <p>Game indices: {{ selectedLocation.game_indices.length }}</p>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900">Encounter areas</h3>
          <p class="text-sm text-slate-500">
            Previewing {{ Math.min(selectedAreas.length, 12) }} areas
          </p>
        </div>

        <div v-if="viewMode === 'grid'" class="mt-4 grid gap-4 md:grid-cols-2">
          <article
            v-for="area in selectedAreas.slice(0, 12)"
            :key="area.name"
            class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
          >
            <div class="flex items-center justify-between">
              <p class="text-base font-semibold capitalize text-slate-800">
                {{ formatName(area.name) }}
              </p>
              <button
                type="button"
                class="text-sm font-semibold text-sky-600"
                @click="ensureAreaDetail(area.name)"
              >
                Refresh
              </button>
            </div>
            <p class="mt-1 text-xs uppercase tracking-[0.35em] text-slate-500">Recent spawns</p>
            <div class="mt-2 flex flex-wrap gap-2 text-sm font-semibold text-slate-700">
              <span
                v-for="pokemon in extractEncounterPreview(areaDetails[area.name])"
                :key="pokemon"
                class="rounded-full bg-white px-3 py-1 capitalize shadow-sm"
              >
                {{ pokemon }}
              </span>
              <span
                v-if="!extractEncounterPreview(areaDetails[area.name]).length"
                class="text-slate-500"
              >
                Load to view encounters
              </span>
            </div>
          </article>
        </div>

        <div v-else class="mt-4 overflow-x-auto">
          <table class="w-full table-auto text-left text-sm">
            <thead class="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="pb-3">Area</th>
                <th class="pb-3">Encounter preview</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="area in selectedAreas.slice(0, 15)"
                :key="`list-${area.name}`"
                class="border-t border-slate-200"
              >
                <td class="py-3 capitalize">{{ formatName(area.name) }}</td>
                <td class="py-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      v-for="pokemon in extractEncounterPreview(areaDetails[area.name])"
                      :key="`list-${area.name}-${pokemon}`"
                      class="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700"
                    >
                      {{ pokemon }}
                    </span>
                    <button
                      type="button"
                      class="text-xs font-semibold text-sky-600"
                      @click="ensureAreaDetail(area.name)"
                    >
                      {{ areaDetails[area.name] ? 'Refresh' : 'Load encounters' }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>
