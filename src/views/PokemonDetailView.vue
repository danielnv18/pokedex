<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { usePokemonStore } from '@/stores/pokemon'
import type { EvolutionChain, Pokemon, PokemonSpecies } from '@/lib/types'
import { cacheSpriteAsset, getFallbackSpriteUrl, getOfficialArtworkUrl } from '@/lib/media'

const route = useRoute()
const pokemonStore = usePokemonStore()

const pokemon = ref<Pokemon | null>(null)
const species = ref<PokemonSpecies | null>(null)
const evolutionChain = ref<EvolutionChain | null>(null)
const isLoading = ref(false)
const errorMessage = ref<string | null>(null)

const identifier = computed(() => route.params.identifier as string)

const heroImage = computed(() => {
  if (!pokemon.value) {
    return { artwork: '', fallback: '' }
  }
  const artwork = getOfficialArtworkUrl(pokemon.value.id)
  const otherSprites = pokemon.value.sprites.other as
    | Record<string, Record<string, string | null>>
    | undefined
  const officialArtwork = otherSprites?.['official-artwork']?.['front_default'] ?? null
  const fallback =
    officialArtwork ?? pokemon.value.sprites.front_default ?? getFallbackSpriteUrl(pokemon.value.id)
  return { artwork, fallback }
})

watch(
  heroImage,
  (image) => {
    cacheSpriteAsset(image.artwork)
  },
  { immediate: true },
)

function handleHeroError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === 'true') {
    return
  }
  target.dataset.fallbackApplied = 'true'
  target.src = heroImage.value.fallback
}

async function loadPokemon() {
  isLoading.value = true
  errorMessage.value = null
  try {
    pokemon.value = await pokemonStore.ensurePokemon(identifier.value)
    species.value = await pokemonStore.ensureSpecies(identifier.value)
    const evolutionUrl = species.value?.evolution_chain?.url
    if (evolutionUrl) {
      const chainId = evolutionUrl.split('/').filter(Boolean).pop()
      if (chainId) {
        evolutionChain.value = await pokemonStore.ensureEvolutionChain(chainId)
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load Pokémon data'
  } finally {
    isLoading.value = false
  }
}

function formatStatName(name: string) {
  return name.replace('-', ' ')
}

function flattenEvolution(chain: EvolutionChain | null) {
  if (!chain) return []
  const nodes: string[] = []
  function traverse(link: EvolutionChain['chain']) {
    nodes.push(link.species.name)
    link.evolves_to.forEach(traverse)
  }
  traverse(chain.chain)
  return nodes
}

const evolutionNames = computed(() => flattenEvolution(evolutionChain.value))

onMounted(loadPokemon)
watch(() => identifier.value, loadPokemon)
</script>

<template>
  <section class="detail-view">
    <RouterLink class="back-link" to="/pokemon">← Back to Pokédex</RouterLink>

    <div v-if="isLoading" class="status">Loading Pokémon…</div>
    <div v-else-if="errorMessage" class="status status--error">{{ errorMessage }}</div>
    <div v-else-if="pokemon" class="detail-card">
      <div class="hero">
        <img
          :src="heroImage.artwork || heroImage.fallback"
          :alt="pokemon.name"
          width="256"
          height="256"
          loading="eager"
          decoding="async"
          fetchpriority="high"
          @error="handleHeroError"
        />
        <div>
          <p class="eyebrow">#{{ pokemon.id.toString().padStart(3, '0') }}</p>
          <h1>{{ pokemon.name }}</h1>
          <div class="type-chips">
            <span v-for="type in pokemon.types" :key="type.slot" class="chip">{{
              type.type.name
            }}</span>
          </div>
          <p v-if="species?.flavor_text_entries?.length" class="flavor">
            {{
              species.flavor_text_entries
                .find((entry) => entry.language.name === 'en')
                ?.flavor_text?.replace(/\f/g, ' ')
            }}
          </p>
        </div>
      </div>

      <div class="grid">
        <section>
          <h2>Stats</h2>
          <ul>
            <li v-for="stat in pokemon.stats" :key="stat.stat.name">
              <span>{{ formatStatName(stat.stat.name) }}</span>
              <strong>{{ stat.base_stat }}</strong>
            </li>
          </ul>
        </section>

        <section>
          <h2>Abilities</h2>
          <ul>
            <li v-for="ability in pokemon.abilities" :key="ability.ability.name">
              {{ ability.ability.name }} <small v-if="ability.is_hidden">(hidden)</small>
            </li>
          </ul>
        </section>

        <section v-if="evolutionNames.length">
          <h2>Evolution Chain</h2>
          <ol class="evolution">
            <li v-for="name in evolutionNames" :key="name">{{ name }}</li>
          </ol>
        </section>
      </div>
    </div>
  </section>
</template>

<style scoped>
.detail-view {
  padding: 2rem 1.5rem 4rem;
  max-width: 960px;
  margin: 0 auto;
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-decoration: none;
  color: #2563eb;
  margin-bottom: 1rem;
}

.detail-card {
  border-radius: 1.5rem;
  border: 1px solid #e2e8f0;
  padding: 2rem;
  background: #fff;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.hero {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
  align-items: center;
}

.hero img {
  background: linear-gradient(135deg, #e0f2fe, #fef3c7);
  border-radius: 1rem;
  padding: 1rem;
}

.eyebrow {
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #94a3b8;
  font-size: 0.9rem;
}

h1 {
  text-transform: capitalize;
  margin-bottom: 0.5rem;
}

.type-chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chip {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  background: #e2e8f0;
  text-transform: capitalize;
}

.flavor {
  margin-top: 1rem;
  color: #475569;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

h2 {
  margin-bottom: 0.75rem;
}

ul,
ol {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.evolution {
  list-style: decimal;
  padding-left: 1.25rem;
}

.status {
  text-align: center;
  padding: 2rem 0;
  color: #475569;
}

.status--error {
  color: #dc2626;
}
</style>
