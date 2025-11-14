<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

import PokemonCard from '@/components/PokemonCard.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { usePokemonStore } from '@/stores/pokemon'

const favoritesStore = useFavoritesStore()
const pokemonStore = usePokemonStore()

favoritesStore.hydrate()

const favoriteIds = computed(() => favoritesStore.ids)

const favoritePokemon = computed(() =>
  favoriteIds.value
    .map((id) => pokemonStore.getPokemonById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p)),
)

async function hydrateFavorites() {
  await Promise.all(favoriteIds.value.map((id) => pokemonStore.ensurePokemon(id)))
}

onMounted(() => {
  hydrateFavorites()
})

watch(favoriteIds, () => {
  hydrateFavorites()
})

function clearAll() {
  favoritesStore.clear()
}
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <div
      class="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Favorites</p>
        <h1 class="mt-3 text-3xl font-semibold text-slate-900">Your team</h1>
        <p class="mt-2 text-sm text-slate-600">Save Pokémon you want to revisit quickly.</p>
      </div>
      <button
        v-if="favoriteIds.length"
        class="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        @click="clearAll"
      >
        Clear all
      </button>
    </div>

    <p
      v-if="!favoriteIds.length"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-slate-500"
    >
      No favorites yet. Tap the star on any Pokémon card to add it.
    </p>

    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="pokemon in favoritePokemon" :key="pokemon.id">
        <PokemonCard
          :id="pokemon.id"
          :name="pokemon.name"
          :sprite-url="pokemon.sprites.front_default ?? undefined"
        />
      </li>
    </ul>
  </section>
</template>
