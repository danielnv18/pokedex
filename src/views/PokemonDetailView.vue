<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

import { cacheSpriteAsset, getFallbackSpriteUrl, getOfficialArtworkUrl } from '@/lib/media'
import { usePokemonStore } from '@/stores/pokemon'
import type { EvolutionChain, Pokemon, PokemonEncounterArea, PokemonSpecies } from '@/lib/types'

const route = useRoute()
const pokemonStore = usePokemonStore()

const pokemon = ref<Pokemon | null>(null)
const species = ref<PokemonSpecies | null>(null)
const evolutionChain = ref<EvolutionChain | null>(null)
const encounters = ref<PokemonEncounterArea[] | null>(null)
const encounterLoading = ref(false)
const encounterError = ref<string | null>(null)
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

function formatLabel(value: string) {
  return value.replace(/-/g, ' ')
}

const flavorText = computed(() => {
  return (
    species.value?.flavor_text_entries
      ?.find((entry) => entry.language.name === 'en')
      ?.flavor_text?.replace(/\f|\n/g, ' ') ?? ''
  )
})

const genusLabel = computed(() => {
  return species.value?.genera.find((entry) => entry.language.name === 'en')?.genus ?? ''
})

const infoMetrics = computed(() => {
  if (!pokemon.value || !species.value) {
    return []
  }
  const heightMeters = (pokemon.value.height / 10).toFixed(1)
  const weightKg = (pokemon.value.weight / 10).toFixed(1)
  return [
    { label: 'Height', value: `${heightMeters} m` },
    { label: 'Weight', value: `${weightKg} kg` },
    {
      label: 'Habitat',
      value: species.value.habitat ? formatLabel(species.value.habitat.name) : 'Unknown',
    },
    { label: 'Generation', value: formatLabel(species.value.generation.name) },
  ]
})

const levelUpMoves = computed(() => {
  if (!pokemon.value) return []
  const rows: Array<{ name: string; level: number; version: string }> = []
  pokemon.value.moves.forEach((move) => {
    const detail = [...move.version_group_details]
      .filter((entry) => entry.move_learn_method.name === 'level-up' && entry.level_learned_at > 0)
      .sort((a, b) => a.level_learned_at - b.level_learned_at)[0]
    if (detail) {
      rows.push({
        name: move.move.name,
        level: detail.level_learned_at,
        version: detail.version_group.name,
      })
    }
  })
  return rows.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name)).slice(0, 12)
})

const encounterHighlights = computed(() => {
  if (!encounters.value?.length) {
    return []
  }
  return encounters.value.slice(0, 5).map((encounter) => {
    const versions = encounter.version_details
      .sort((a, b) => b.max_chance - a.max_chance)
      .slice(0, 2)
      .map((detail) => ({
        version: detail.version.name,
        chance: detail.max_chance,
        methods: Array.from(
          new Set(detail.encounter_details.map((entry) => formatLabel(entry.method.name))),
        ).join(', '),
      }))
    return {
      area: encounter.location_area.name,
      versions,
    }
  })
})

function handleHeroError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === 'true') {
    return
  }
  target.dataset.fallbackApplied = 'true'
  target.src = heroImage.value.fallback
}

async function hydrateEncounters() {
  if (!pokemon.value) {
    encounters.value = []
    return
  }
  encounterLoading.value = true
  encounterError.value = null
  try {
    const results = await pokemonStore.ensurePokemonEncounters(
      pokemon.value.id,
      pokemon.value.location_area_encounters,
    )
    encounters.value = results
  } catch (error) {
    encounterError.value = error instanceof Error ? error.message : 'Failed to load encounters'
    encounters.value = []
  } finally {
    encounterLoading.value = false
  }
}

async function loadPokemon() {
  isLoading.value = true
  errorMessage.value = null
  encounters.value = null
  encounterError.value = null
  try {
    pokemon.value = await pokemonStore.ensurePokemon(identifier.value)
    species.value = await pokemonStore.ensureSpecies(identifier.value)
    const evolutionUrl = species.value?.evolution_chain?.url
    if (evolutionUrl) {
      const chainId = evolutionUrl.split('/').filter(Boolean).pop()
      if (chainId) {
        evolutionChain.value = await pokemonStore.ensureEvolutionChain(chainId)
      }
    } else {
      evolutionChain.value = null
    }
    await hydrateEncounters()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load Pokémon data'
  } finally {
    isLoading.value = false
  }
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
watch(
  () => identifier.value,
  () => {
    loadPokemon()
  },
)
</script>

<template>
  <section class="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6 lg:px-10">
    <RouterLink class="text-sm font-semibold text-sky-600" to="/pokemon">
      ← Back to Pokédex
    </RouterLink>

    <div
      v-if="isLoading"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-slate-500"
    >
      Loading Pokémon…
    </div>
    <div
      v-else-if="errorMessage"
      class="rounded-2xl border border-slate-200 bg-white px-4 py-8 text-center font-semibold text-red-500"
    >
      {{ errorMessage }}
    </div>

    <div v-else-if="pokemon" class="space-y-8">
      <div class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl lg:p-8">
        <div class="grid gap-8 lg:grid-cols-[320px,1fr]">
          <div class="flex flex-col items-center gap-4 text-center">
            <img
              :src="heroImage.artwork || heroImage.fallback"
              :alt="pokemon.name"
              width="320"
              height="320"
              loading="eager"
              decoding="async"
              fetchpriority="high"
              class="h-64 w-64 rounded-3xl bg-gradient-to-br from-sky-100 via-amber-100 to-rose-100 object-contain p-6 shadow-inner"
              @error="handleHeroError"
            />
            <div class="flex flex-wrap items-center justify-center gap-2">
              <RouterLink
                v-for="type in pokemon.types"
                :key="type.slot"
                class="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold capitalize text-slate-700 transition hover:border-sky-300"
                :to="{ name: 'type-detail', params: { identifier: type.type.name } }"
              >
                {{ type.type.name }}
              </RouterLink>
            </div>
          </div>
          <div class="space-y-4">
            <div class="flex items-center gap-4 text-sm uppercase tracking-[0.45em] text-slate-500">
              <span>#{{ pokemon.id.toString().padStart(3, '0') }}</span>
              <span>{{ genusLabel }}</span>
            </div>
            <h1 class="text-4xl font-semibold capitalize text-slate-900">
              {{ pokemon.name }}
            </h1>
            <p v-if="flavorText" class="text-lg text-slate-600">
              {{ flavorText }}
            </p>
            <dl
              class="grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-2"
            >
              <div v-for="metric in infoMetrics" :key="metric.label" class="space-y-1">
                <dt class="text-xs uppercase tracking-[0.35em] text-slate-500">
                  {{ metric.label }}
                </dt>
                <dd class="text-lg font-semibold text-slate-900">
                  {{ metric.value }}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Stats</h2>
          <ul class="mt-4 space-y-4">
            <li v-for="stat in pokemon.stats" :key="stat.stat.name">
              <div class="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span class="capitalize">{{ formatLabel(stat.stat.name) }}</span>
                <span>{{ stat.base_stat }}</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-slate-100">
                <div
                  class="h-full rounded-full bg-sky-500"
                  :style="{
                    width: `${Math.min(100, Math.round((stat.base_stat / 255) * 100))}%`,
                  }"
                ></div>
              </div>
            </li>
          </ul>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-slate-900">Abilities</h2>
          <ul class="mt-4 space-y-3 text-sm text-slate-700">
            <li
              v-for="ability in pokemon.abilities"
              :key="ability.ability.name"
              class="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 capitalize"
            >
              <RouterLink
                class="font-semibold text-slate-800 transition hover:text-sky-600"
                :to="{ name: 'ability-detail', params: { identifier: ability.ability.name } }"
              >
                {{ formatLabel(ability.ability.name) }}
              </RouterLink>
              <span
                v-if="ability.is_hidden"
                class="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Hidden
              </span>
            </li>
          </ul>
        </section>

        <section
          v-if="evolutionNames.length"
          class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm"
        >
          <h2 class="text-lg font-semibold text-slate-900">Evolution Chain</h2>
          <ol class="mt-4 space-y-3">
            <li
              v-for="name in evolutionNames"
              :key="name"
              class="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 capitalize text-slate-700"
            >
              {{ name }}
            </li>
          </ol>
        </section>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Signature moves</h2>
            <span class="text-xs uppercase tracking-[0.2em] text-slate-500">Level-up</span>
          </div>
          <div v-if="!levelUpMoves.length" class="mt-6 text-sm text-slate-500">
            No level-up moves available for this Pokémon.
          </div>
          <table
            v-else
            class="mt-4 w-full table-fixed text-left text-sm lg:max-w-xl lg:self-center"
          >
            <thead class="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th class="pb-2">Move</th>
                <th class="pb-2">Level</th>
                <th class="pb-2">Version</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="move in levelUpMoves"
                :key="move.name + move.level + move.version"
                class="border-t border-slate-200"
              >
                <td class="py-3 capitalize">{{ formatLabel(move.name) }}</td>
                <td class="py-3 font-semibold">{{ move.level }}</td>
                <td class="py-3 capitalize text-slate-600">{{ formatLabel(move.version) }}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section class="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">Where to find</h2>
            <span class="text-xs uppercase tracking-[0.2em] text-slate-500">Encounters</span>
          </div>
          <div v-if="encounterLoading" class="mt-6 text-sm text-slate-500">Loading encounters…</div>
          <div v-else-if="encounterError" class="mt-6 text-sm font-semibold text-red-500">
            {{ encounterError }}
          </div>
          <ul v-else-if="encounterHighlights.length" class="mt-4 space-y-4">
            <li
              v-for="encounter in encounterHighlights"
              :key="encounter.area"
              class="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <p class="text-sm font-semibold capitalize text-slate-900">
                {{ formatLabel(encounter.area) }}
              </p>
              <div class="mt-2 space-y-1 text-xs text-slate-600">
                <p
                  v-for="version in encounter.versions"
                  :key="version.version"
                  class="flex items-center justify-between gap-3"
                >
                  <span class="capitalize">{{ formatLabel(version.version) }}</span>
                  <span class="text-slate-700">
                    {{ version.chance }}% · {{ version.methods || '—' }}
                  </span>
                </p>
              </div>
            </li>
          </ul>
          <p v-else class="mt-6 text-sm text-slate-500">
            Encounter data is not available for this Pokémon.
          </p>
        </section>
      </div>
    </div>
  </section>
</template>
