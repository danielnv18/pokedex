<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import type { PokemonType } from '@/lib/types'
import { usePokemonStore } from '@/stores/pokemon'

const route = useRoute()
const pokemonStore = usePokemonStore()

const identifier = computed(() => route.params.identifier as string)
const typeRecord = ref<PokemonType | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function loadType() {
  isLoading.value = true
  errorMessage.value = null
  try {
    typeRecord.value = await pokemonStore.ensureType(identifier.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load type'
  } finally {
    isLoading.value = false
  }
}

const formattedName = computed(() => typeRecord.value?.name.replace('-', ' ') ?? '')

const relations = computed(() => {
  const record = typeRecord.value
  if (!record) {
    return null
  }
  const { damage_relations } = record
  function mapNames(list: PokemonType['damage_relations']['double_damage_from']) {
    return list.map((entry) => entry.name)
  }
  return {
    double_from: mapNames(damage_relations.double_damage_from),
    double_to: mapNames(damage_relations.double_damage_to),
    half_from: mapNames(damage_relations.half_damage_from),
    half_to: mapNames(damage_relations.half_damage_to),
    no_from: mapNames(damage_relations.no_damage_from),
    no_to: mapNames(damage_relations.no_damage_to),
  }
})

const featuredPokemon = computed(() => {
  if (!typeRecord.value) return []
  return typeRecord.value.pokemon
    .slice(0, 18)
    .map((entry) => ({ name: entry.pokemon.name, url: entry.pokemon.url }))
})

function extractId(resourceUrl: string) {
  const segments = resourceUrl.split('/').filter(Boolean)
  return Number(segments[segments.length - 1])
}

function formatLabel(value: string) {
  return value.replace('-', ' ')
}

onMounted(loadType)
watch(
  () => identifier.value,
  () => {
    loadType()
  },
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <RouterLink class="text-sm font-semibold text-sky-600" to="/pokemon"
      >← Back to Pokédex</RouterLink
    >

    <div
      v-if="isLoading"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-slate-500"
    >
      Loading type data…
    </div>
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center font-semibold text-red-500"
    >
      {{ errorMessage }}
    </div>

    <div v-else-if="typeRecord" class="space-y-8">
      <header
        class="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 shadow-sm"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Type</p>
        <h1 class="mt-3 text-4xl font-semibold capitalize text-slate-900">{{ formattedName }}</h1>
        <p class="mt-2 text-sm text-slate-600">
          Includes {{ typeRecord.pokemon.length }} Pokémon across
          {{ typeRecord.moves.length }} moves.
        </p>
      </header>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Offensive matchups</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Deals double damage</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.double_to ?? []"
                  :key="`double-to-${type}`"
                  class="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold capitalize text-sky-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.double_to?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Deals half damage</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.half_to ?? []"
                  :key="`half-to-${type}`"
                  class="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium capitalize text-slate-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.half_to?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">No effect on</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.no_to ?? []"
                  :key="`no-to-${type}`"
                  class="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium capitalize text-slate-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.no_to?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
          </div>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Defensive matchups</h2>
          <div class="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Takes double damage</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.double_from ?? []"
                  :key="`double-from-${type}`"
                  class="rounded-full bg-rose-100 px-3 py-1 text-sm font-semibold capitalize text-rose-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.double_from?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
            <div>
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Resists</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.half_from ?? []"
                  :key="`half-from-${type}`"
                  class="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold capitalize text-emerald-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.half_from?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
            <div class="sm:col-span-2">
              <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Immune to</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="type in relations?.no_from ?? []"
                  :key="`no-from-${type}`"
                  class="rounded-full bg-slate-200 px-3 py-1 text-sm font-medium capitalize text-slate-700"
                >
                  {{ type }}
                </span>
                <span v-if="!relations?.no_from?.length" class="text-sm text-slate-500">—</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Featured Pokémon</h2>
          <RouterLink class="text-sm font-semibold text-sky-600" to="/pokemon">
            View full Pokédex →
          </RouterLink>
        </div>
        <p class="mt-2 text-sm text-slate-500">
          Showing {{ featuredPokemon.length }} Pokémon with the {{ formattedName }} type.
        </p>
        <ul class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li v-for="pokemon in featuredPokemon" :key="pokemon.name">
            <RouterLink
              class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 capitalize text-slate-800 transition hover:border-sky-300"
              :to="{ name: 'pokemon-detail', params: { identifier: extractId(pokemon.url) } }"
            >
              {{ formatLabel(pokemon.name) }}
              <span class="text-sm text-slate-500">#{{ extractId(pokemon.url) }}</span>
            </RouterLink>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
