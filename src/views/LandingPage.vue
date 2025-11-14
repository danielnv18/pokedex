<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import PokemonCard from '@/components/PokemonCard.vue'
import { usePokemonStore } from '@/stores/pokemon'

const FEATURED_LIMIT = 12
const FEATURED_OFFSET = 0
const LIST_CACHE_KEY = `list:limit:${FEATURED_LIMIT}|offset:${FEATURED_OFFSET}`

const store = usePokemonStore()

const featuredList = computed(() => store.getListByKey(LIST_CACHE_KEY)?.results ?? null)
const listStatus = computed(() => store.getStatus(LIST_CACHE_KEY))

onMounted(async () => {
  try {
    await store.fetchPokemonList({ limit: FEATURED_LIMIT, offset: FEATURED_OFFSET })
  } catch (error) {
    console.error('Unable to load Pokémon list', error)
  }
})

function formatPokemonName(name: string) {
  return name.replace(/-/g, ' ')
}

function extractPokemonId(resourceUrl: string) {
  const segments = resourceUrl.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
}

const hasError = computed(() => listStatus.value.hasError)
const errorMessage = computed(
  () => listStatus.value.errorMessage ?? 'Something went wrong loading Pokémon.',
)

function retryFetch() {
  return store.fetchPokemonList({ limit: FEATURED_LIMIT, offset: FEATURED_OFFSET })
}
</script>

<template>
  <section class="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-10">
    <div class="text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Pokédex</p>
      <h1 class="mt-4 text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl">
        Catch up with your favorite Pokémon.
      </h1>
      <p class="mx-auto mt-4 max-w-3xl text-base text-slate-600">
        Quickly preview a handful of featured Pokémon fetched from PokéAPI, then hop into the full
        index to explore more companions by type, generation, and stats.
      </p>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <RouterLink
          class="inline-flex items-center justify-center rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600"
          to="/pokemon"
        >
          Open Pokédex
        </RouterLink>
        <button
          class="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-progress disabled:opacity-60"
          @click="retryFetch"
          :disabled="listStatus.isLoading"
        >
          {{ listStatus.isLoading ? 'Loading…' : 'Refresh list' }}
        </button>
      </div>
    </div>

    <div class="min-h-[240px]">
      <p v-if="listStatus.isLoading && !featuredList" class="text-center text-slate-500">
        Loading featured Pokémon…
      </p>
      <p v-else-if="hasError" class="text-center font-medium text-red-500">
        {{ errorMessage }}
      </p>

      <ul
        v-else
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        aria-live="polite"
        aria-busy="false"
      >
        <li v-for="resource in featuredList?.results ?? []" :key="resource.name">
          <PokemonCard
            :id="extractPokemonId(resource.url)"
            :name="formatPokemonName(resource.name)"
          />
        </li>
      </ul>
    </div>
  </section>
</template>
