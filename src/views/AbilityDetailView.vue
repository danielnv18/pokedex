<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import type { Ability } from '@/lib/types'
import { useCatalogStore } from '@/stores/catalog'

const route = useRoute()
const catalogStore = useCatalogStore()

const identifier = computed(() => route.params.identifier as string)
const ability = ref<Ability | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

async function loadAbility() {
  isLoading.value = true
  errorMessage.value = null
  try {
    ability.value = await catalogStore.ensureAbility(identifier.value)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load ability'
  } finally {
    isLoading.value = false
  }
}

const effectText = computed(() => {
  return (
    ability.value?.effect_entries.find((entry) => entry.language.name === 'en')?.effect ??
    'No effect text available.'
  )
})

const shortEffect = computed(() => {
  return (
    ability.value?.effect_entries.find((entry) => entry.language.name === 'en')?.short_effect ??
    'No summary available.'
  )
})

const generationLabel = computed(() =>
  ability.value ? ability.value.generation.name.replace('-', ' ') : '',
)

const pokemonWithAbility = computed(() => {
  if (!ability.value) return []
  return ability.value.pokemon.slice(0, 24)
})

function formatName(value: string) {
  return value.replace('-', ' ')
}

onMounted(loadAbility)
watch(
  () => identifier.value,
  () => {
    loadAbility()
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
      Loading ability…
    </div>
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center font-semibold text-red-500"
    >
      {{ errorMessage }}
    </div>

    <div v-else-if="ability" class="space-y-8">
      <header class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Ability</p>
        <h1 class="mt-3 text-4xl font-semibold capitalize text-slate-900">
          {{ formatName(ability.name) }}
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Introduced in {{ generationLabel }} — {{ ability.pokemon.length }} Pokémon can learn it.
        </p>
      </header>

      <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-slate-900">Effect</h2>
        <p class="mt-2 text-sm text-slate-500">{{ shortEffect }}</p>
        <p class="mt-4 whitespace-pre-line text-slate-700">{{ effectText }}</p>
      </section>

      <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-slate-900">Pokémon with this ability</h2>
          <RouterLink class="text-sm font-semibold text-sky-600" to="/pokemon">
            Explore Pokédex →
          </RouterLink>
        </div>
        <ul class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <li
            v-for="entry in pokemonWithAbility"
            :key="entry.pokemon.name"
            class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <div
              class="flex items-center justify-between text-sm font-semibold capitalize text-slate-800"
            >
              <RouterLink
                class="flex-1 text-left transition hover:text-sky-600"
                :to="{ name: 'pokemon-detail', params: { identifier: entry.pokemon.name } }"
              >
                {{ formatName(entry.pokemon.name) }}
              </RouterLink>
              <span
                v-if="entry.is_hidden"
                class="ml-3 rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Hidden
              </span>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </section>
</template>
