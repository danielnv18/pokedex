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
  <section class="favorites-view">
    <div class="favorites-view__header">
      <div>
        <p class="eyebrow">Favorites</p>
        <h1>Your team</h1>
        <p class="subhead">Save Pokémon you want to revisit quickly.</p>
      </div>
      <button v-if="favoriteIds.length" class="clear" @click="clearAll">Clear all</button>
    </div>

    <p v-if="!favoriteIds.length" class="status">
      No favorites yet. Tap the star on any Pokémon card to add it.
    </p>

    <ul v-else class="pokemon-grid">
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

<style scoped>
.favorites-view {
  padding: 2rem 1.5rem 4rem;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.favorites-view__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.clear {
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  background: transparent;
  padding: 0.5rem 1rem;
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

.eyebrow {
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}

h1 {
  margin: 0.25rem 0;
}

.subhead {
  color: #475569;
}
</style>
