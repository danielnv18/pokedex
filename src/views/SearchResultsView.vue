<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { fetchItem, fetchMove } from '@/lib/api-client'
import type { Item, Move, Pokemon } from '@/lib/types'
import { usePokemonStore } from '@/stores/pokemon'

const route = useRoute()
const router = useRouter()
const pokemonStore = usePokemonStore()

interface ResourceState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

const query = ref<string>((route.query.q as string) ?? '')
const results = reactive<{
  pokemon: ResourceState<Pokemon>
  move: ResourceState<Move>
  item: ResourceState<Item>
}>({
  pokemon: { data: null, error: null, loading: false },
  move: { data: null, error: null, loading: false },
  item: { data: null, error: null, loading: false },
})

const hasQuery = computed(() => Boolean(query.value.trim()))

async function runSearch(term: string, options: { syncRoute?: boolean } = {}) {
  const { syncRoute = true } = options
  const trimmed = term.trim().toLowerCase()
  if (!trimmed) {
    clearResults()
    if (syncRoute) {
      await router.replace({ query: {} })
    }
    return
  }
  if (syncRoute) {
    await router.replace({ query: { q: trimmed } })
  }
  await Promise.all([
    searchResource('pokemon', trimmed),
    searchResource('move', trimmed),
    searchResource('item', trimmed),
  ])
}

async function searchResource(resource: 'pokemon' | 'move' | 'item', term: string) {
  const target = results[resource]
  target.loading = true
  target.error = null
  target.data = null
  try {
    if (resource === 'pokemon') {
      target.data = await pokemonStore.ensurePokemon(term)
    } else if (resource === 'move') {
      target.data = await fetchMove(term)
    } else {
      target.data = await fetchItem(term)
    }
  } catch (error) {
    target.error = error instanceof Error ? error.message : 'Not found'
  } finally {
    target.loading = false
  }
}

function clearResults() {
  ;(['pokemon', 'move', 'item'] as const).forEach((resource) => {
    results[resource].data = null
    results[resource].error = null
    results[resource].loading = false
  })
}

function submit(event: Event) {
  event.preventDefault()
  runSearch(query.value)
}

watch(
  () => route.query.q,
  (value) => {
    if (typeof value === 'string' && value.trim()) {
      query.value = value
      runSearch(value, { syncRoute: false })
    } else {
      query.value = ''
      clearResults()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <form class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm" @submit="submit">
      <label class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span class="text-sm font-medium text-slate-600">Search the Pokédex</span>
        <div class="flex flex-1 flex-col gap-3 sm:flex-row">
          <input
            id="search-query"
            v-model="query"
            type="search"
            placeholder="Try pikachu, thunderbolt, potion"
            class="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-base shadow-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200"
          />
          <button
            type="submit"
            class="w-full rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-600 sm:w-auto"
          >
            Search
          </button>
        </div>
      </label>
    </form>

    <div
      v-if="!hasQuery"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-slate-500"
    >
      Enter a query to search Pokémon, moves, and items.
    </div>

    <div v-else class="grid gap-6 md:grid-cols-3">
      <section class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Pokémon</h2>
          <span class="text-xs uppercase tracking-[0.2em] text-slate-500">/pokemon</span>
        </div>
        <div v-if="results.pokemon.loading" class="mt-6 text-sm text-slate-500">Searching…</div>
        <article
          v-else-if="results.pokemon.data"
          class="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4"
        >
          <p class="text-xs uppercase tracking-[0.4em] text-slate-500">
            #{{ results.pokemon.data.id.toString().padStart(3, '0') }}
          </p>
          <h3 class="text-2xl font-semibold capitalize">{{ results.pokemon.data.name }}</h3>
          <div class="flex flex-wrap gap-2 text-sm">
            <span
              v-for="type in results.pokemon.data.types"
              :key="type.slot"
              class="rounded-full bg-slate-100 px-3 py-1 font-medium capitalize text-slate-700"
            >
              {{ type.type.name }}
            </span>
          </div>
          <RouterLink
            class="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
            :to="{ name: 'pokemon-detail', params: { identifier: results.pokemon.data.id } }"
          >
            View details →
          </RouterLink>
        </article>
        <p v-else class="mt-6 text-sm text-slate-500">
          {{ results.pokemon.error ?? 'No Pokémon found.' }}
        </p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Moves</h2>
          <span class="text-xs uppercase tracking-[0.2em] text-slate-500">/move</span>
        </div>
        <div v-if="results.move.loading" class="mt-6 text-sm text-slate-500">Searching…</div>
        <article
          v-else-if="results.move.data"
          class="mt-4 space-y-2 rounded-2xl border border-slate-200 bg-white/90 p-4"
        >
          <h3 class="text-xl font-semibold capitalize">{{ results.move.data.name }}</h3>
          <p class="text-sm text-slate-600">
            Power:
            <span class="font-semibold text-slate-900">
              {{ results.move.data.power ?? '—' }}
            </span>
          </p>
          <p class="text-sm text-slate-600">
            Accuracy:
            <span class="font-semibold text-slate-900">
              {{ results.move.data.accuracy ?? '—' }}
            </span>
          </p>
          <p class="text-sm text-slate-600">
            Damage class:
            <span class="font-semibold capitalize text-slate-900">
              {{ results.move.data.damage_class.name }}
            </span>
          </p>
        </article>
        <p v-else class="mt-6 text-sm text-slate-500">
          {{ results.move.error ?? 'No move found.' }}
        </p>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-slate-900">Items</h2>
          <span class="text-xs uppercase tracking-[0.2em] text-slate-500">/item</span>
        </div>
        <div v-if="results.item.loading" class="mt-6 text-sm text-slate-500">Searching…</div>
        <article
          v-else-if="results.item.data"
          class="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="results.item.data.sprites?.default"
              :src="results.item.data.sprites.default"
              :alt="`${results.item.data.name} sprite`"
              class="h-12 w-12 object-contain"
              loading="lazy"
              decoding="async"
            />
            <h3 class="text-xl font-semibold capitalize">{{ results.item.data.name }}</h3>
          </div>
          <p class="text-sm text-slate-600">
            Cost:
            <span class="font-semibold text-slate-900">
              {{ results.item.data.cost ?? '—' }}
            </span>
          </p>
          <p class="text-sm text-slate-600">
            {{
              results.item.data.effect_entries.find((entry) => entry.language.name === 'en')
                ?.short_effect ?? 'No effect summary available.'
            }}
          </p>
        </article>
        <p v-else class="mt-6 text-sm text-slate-500">
          {{ results.item.error ?? 'No item found.' }}
        </p>
      </section>
    </div>
  </section>
</template>
