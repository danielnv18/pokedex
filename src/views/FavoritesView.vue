<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import PokemonCard from '@/components/PokemonCard.vue'
import { useFavoritesStore } from '@/stores/favorites'
import { usePokemonStore } from '@/stores/pokemon'

const favoritesStore = useFavoritesStore()
const pokemonStore = usePokemonStore()

favoritesStore.hydrate()

const favoriteIds = computed(() => favoritesStore.ids)
const teamSlots = computed(() => favoritesStore.team)

const favoritePokemon = computed(() =>
  favoriteIds.value
    .map((id) => pokemonStore.getPokemonById(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p)),
)

const teamMembers = computed(() =>
  teamSlots.value.map((id) => (typeof id === 'number' ? pokemonStore.getPokemonById(id) : null)),
)

async function hydrateFavorites() {
  const ids = [
    ...favoriteIds.value,
    ...teamSlots.value.filter((id): id is number => typeof id === 'number'),
  ]
  await Promise.all(ids.map((id) => pokemonStore.ensurePokemon(id)))
}

onMounted(() => {
  hydrateFavorites()
})

watch(
  favoriteIds,
  () => {
    hydrateFavorites()
  },
  { deep: true },
)

watch(teamSlots, () => {
  hydrateFavorites()
})

function clearAll() {
  favoritesStore.clear()
}

function removeFromTeam(index: number) {
  favoritesStore.setTeamSlot(index, null)
}

function clearTeam() {
  favoritesStore.clearTeam()
}

function addToTeam(id: number) {
  favoritesStore.addToTeam(id)
}

const activeDropIndex = ref<number | null>(null)

function onSlotDragStart(event: DragEvent, index: number) {
  if (teamSlots.value[index] === null) {
    event.preventDefault()
    return
  }
  activeDropIndex.value = index
  event.dataTransfer?.setData('team-slot', String(index))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

function onFavoriteDragStart(event: DragEvent, pokemonId: number) {
  event.dataTransfer?.setData('pokemon-id', String(pokemonId))
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}

function onSlotDragOver(event: DragEvent) {
  event.preventDefault()
}

function onSlotDrop(event: DragEvent, index: number) {
  event.preventDefault()
  const fromSlot = event.dataTransfer?.getData('team-slot')
  const pokemonId = event.dataTransfer?.getData('pokemon-id')
  if (fromSlot) {
    favoritesStore.swapTeamSlots(Number(fromSlot), index)
  } else if (pokemonId) {
    favoritesStore.setTeamSlot(index, Number(pokemonId))
  }
  activeDropIndex.value = null
}

function onDragEnd() {
  activeDropIndex.value = null
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

    <section class="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">
            Team Builder
          </p>
          <p class="mt-1 text-sm text-slate-600">
            Drag Pokémon into slots or reorder existing members to plan your squad.
          </p>
        </div>
        <button
          type="button"
          class="text-sm font-semibold text-slate-700 underline-offset-2 hover:underline"
          @click="clearTeam"
        >
          Clear team
        </button>
      </div>
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div
          v-for="(_, index) in teamSlots"
          :key="`team-slot-${index}`"
          class="flex flex-col rounded-2xl border-2 border-dashed p-4 transition"
          :class="
            activeDropIndex === index
              ? 'border-sky-500 bg-sky-50'
              : teamSlots[index]
                ? 'border-slate-300 bg-white'
                : 'border-slate-200 bg-slate-50'
          "
          :draggable="Boolean(teamSlots[index])"
          @dragstart="onSlotDragStart($event, index)"
          @dragover="onSlotDragOver"
          @drop="onSlotDrop($event, index)"
          @dragend="onDragEnd"
        >
          <template v-if="teamMembers[index]">
            <div class="flex items-center gap-3">
              <img
                :src="teamMembers[index]?.sprites.front_default ?? ''"
                :alt="teamMembers[index]?.name ?? ''"
                class="h-14 w-14 rounded-full bg-slate-100 object-contain"
              />
              <div>
                <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
                  Slot {{ index + 1 }}
                </p>
                <p class="text-lg font-semibold capitalize text-slate-900">
                  {{ teamMembers[index]?.name }}
                </p>
              </div>
            </div>
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
              <span
                v-for="type in teamMembers[index]?.types ?? []"
                :key="type.type.name"
                class="rounded-full bg-slate-100 px-2 py-0.5 capitalize"
              >
                {{ type.type.name }}
              </span>
            </div>
            <button
              type="button"
              class="mt-4 self-end text-sm font-semibold text-rose-600"
              @click="removeFromTeam(index)"
            >
              Remove
            </button>
          </template>
          <template v-else>
            <p class="text-xs uppercase tracking-[0.35em] text-slate-500">Slot {{ index + 1 }}</p>
            <p class="mt-2 text-sm text-slate-500">Drop a favorite here to assign it.</p>
          </template>
        </div>
      </div>
    </section>

    <p
      v-if="!favoriteIds.length"
      class="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center text-slate-500"
    >
      No favorites yet. Tap the star on any Pokémon card to add it.
    </p>

    <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <li v-for="pokemon in favoritePokemon" :key="pokemon.id">
        <div
          class="group rounded-2xl border border-slate-200 bg-white p-2"
          draggable="true"
          @dragstart="onFavoriteDragStart($event, pokemon.id)"
          @dragend="onDragEnd"
        >
          <PokemonCard
            :id="pokemon.id"
            :name="pokemon.name"
            :sprite-url="pokemon.sprites.front_default ?? undefined"
          />
          <button
            type="button"
            class="mt-2 w-full rounded-full border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            @click="addToTeam(pokemon.id)"
          >
            Add to team
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>
