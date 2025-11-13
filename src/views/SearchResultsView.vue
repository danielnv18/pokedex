<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import { fetchPokemon } from '@/lib/api-client'
import type { Pokemon } from '@/lib/types'

const route = useRoute()
const router = useRouter()

interface MoveResult {
  id: number
  name: string
  power: number | null
  accuracy: number | null
}

interface ItemResult {
  id: number
  name: string
  cost: number | null
  sprites?: { default: string | null }
}

const query = ref<string>((route.query.q as string) ?? '')
const results = reactive<{
  pokemon: { data: Pokemon | null; error: string | null; loading: boolean }
  move: { data: MoveResult | null; error: string | null; loading: boolean }
  item: { data: ItemResult | null; error: string | null; loading: boolean }
}>({
  pokemon: { data: null, error: null, loading: false },
  move: { data: null, error: null, loading: false },
  item: { data: null, error: null, loading: false },
})

const hasQuery = computed(() => Boolean(query.value.trim()))

async function runSearch(term: string) {
  if (!term.trim()) {
    clearResults()
    return
  }
  await router.replace({ query: { q: term } })
  await Promise.all([
    searchResource('pokemon', term),
    searchResource('move', term),
    searchResource('item', term),
  ])
}

async function searchResource(resource: 'pokemon' | 'move' | 'item', term: string) {
  const target = results[resource]
  target.loading = true
  target.error = null
  target.data = null
  try {
    if (resource === 'pokemon') {
      target.data = await fetchPokemon(term.toLowerCase())
    } else {
      const response = await fetch(`https://pokeapi.co/api/v2/${resource}/${term.toLowerCase()}`)
      if (!response.ok) {
        throw new Error('Not found')
      }
      target.data = (await response.json()) as MoveResult | ItemResult
    }
  } catch (error) {
    target.error = error instanceof Error ? error.message : 'Not found'
  } finally {
    target.loading = false
  }
}

function clearResults() {
  Object.keys(results).forEach((key) => {
    const resource = key as 'pokemon' | 'move' | 'item'
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
      runSearch(value)
    } else {
      clearResults()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="search-view">
    <form class="search-form" @submit="submit">
      <label for="search-query">Search the Pokédex</label>
      <div class="search-input">
        <input
          id="search-query"
          v-model="query"
          type="search"
          placeholder="Try pikachu, thunderbolt, potion"
        />
        <button type="submit">Search</button>
      </div>
    </form>

    <div v-if="!hasQuery" class="status">Enter a query to search Pokémon, moves, and items.</div>

    <div v-else class="results-grid">
      <section>
        <h2>Pokémon</h2>
        <div v-if="results.pokemon.loading" class="status">Searching…</div>
        <article v-else-if="results.pokemon.data" class="result-card">
          <p class="eyebrow">#{{ results.pokemon.data.id }}</p>
          <h3>{{ results.pokemon.data.name }}</h3>
          <RouterLink :to="{ name: 'pokemon-detail', params: { identifier: results.pokemon.data.id } }">
            View details
          </RouterLink>
        </article>
        <p v-else class="status">{{ results.pokemon.error ?? 'No Pokémon found.' }}</p>
      </section>

      <section>
        <h2>Moves</h2>
        <div v-if="results.move.loading" class="status">Searching…</div>
        <article v-else-if="results.move.data" class="result-card">
          <h3>{{ results.move.data.name }}</h3>
          <p>Power: {{ results.move.data.power ?? '—' }}</p>
          <p>Accuracy: {{ results.move.data.accuracy ?? '—' }}</p>
        </article>
        <p v-else class="status">{{ results.move.error ?? 'No move found.' }}</p>
      </section>

      <section>
        <h2>Items</h2>
        <div v-if="results.item.loading" class="status">Searching…</div>
        <article v-else-if="results.item.data" class="result-card">
          <h3>{{ results.item.data.name }}</h3>
          <p>Cost: {{ results.item.data.cost ?? '—' }}</p>
        </article>
        <p v-else class="status">{{ results.item.error ?? 'No item found.' }}</p>
      </section>
    </div>
  </section>
</template>

<style scoped>
.search-view {
  padding: 2rem 1.5rem 4rem;
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.search-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.search-input {
  display: flex;
  gap: 0.5rem;
}

.search-input input {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid #cbd5f5;
}

.search-input button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.75rem;
  background: #2563eb;
  color: #fff;
  font-weight: 600;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
}

.result-card {
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  background: #fff;
}

.status {
  color: #475569;
}

.eyebrow {
  font-size: 0.85rem;
  color: #94a3b8;
}

h2 {
  margin-bottom: 0.5rem;
}

h3 {
  text-transform: capitalize;
}
</style>
