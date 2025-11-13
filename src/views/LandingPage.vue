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
const errorMessage = computed(() => listStatus.value.errorMessage ?? 'Something went wrong loading Pokémon.')

function retryFetch() {
  return store.fetchPokemonList({ limit: FEATURED_LIMIT, offset: FEATURED_OFFSET })
}
</script>

<template>
  <section class="landing">
    <div class="landing__hero">
      <p class="eyebrow">Pokédex</p>
      <h1>Catch up with your favorite Pokémon.</h1>
      <p class="subhead">
        Quickly preview a handful of featured Pokémon fetched from the PokéAPI, then hop into the full index to explore more.
      </p>
      <RouterLink class="cta" to="/pokemon">Open Pokédex</RouterLink>
      <button class="refresh" @click="retryFetch" :disabled="listStatus.isLoading">
        {{ listStatus.isLoading ? 'Loading…' : 'Refresh list' }}
      </button>
    </div>

    <div class="landing__grid">
      <p v-if="listStatus.isLoading && !featuredList" class="status">Loading featured Pokémon…</p>
      <p v-else-if="hasError" class="status status--error">{{ errorMessage }}</p>

      <ul v-else class="pokemon-grid" aria-live="polite">
        <li v-for="resource in featuredList?.results ?? []" :key="resource.name">
          <PokemonCard :id="extractPokemonId(resource.url)" :name="formatPokemonName(resource.name)" />
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.landing {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 3rem 1.5rem 4rem;
  max-width: 960px;
  margin: 0 auto;
}

.landing__hero {
  text-align: center;
}

.eyebrow {
  font-size: 0.875rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 0.5rem;
  color: #64748b;
}

h1 {
  font-size: clamp(2.25rem, 6vw, 3rem);
  margin-bottom: 0.75rem;
  color: #0f172a;
}

.subhead {
  color: #475569;
  margin-bottom: 1.5rem;
  max-width: 40rem;
  margin-left: auto;
  margin-right: auto;
}

.cta,
.refresh {
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  border: none;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  margin-right: 0.5rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.refresh {
  background: #0f172a;
}

.refresh:disabled {
  opacity: 0.6;
  cursor: progress;
}

.landing__grid {
  min-height: 240px;
}

.status {
  text-align: center;
  color: #475569;
}

.status--error {
  color: #dc2626;
}

.pokemon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
</style>
