<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { cacheSpriteAsset, getFallbackSpriteUrl, getOfficialArtworkUrl } from '@/lib/media'
import { useFavoritesStore } from '@/stores/favorites'

const props = defineProps<{
  id: number
  name: string
  description?: string
  spriteUrl?: string
}>()

const favoritesStore = useFavoritesStore()
favoritesStore.hydrate()

const isFavorite = computed(() => favoritesStore.isFavorite(props.id))

function toggleFavorite(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  favoritesStore.toggle(props.id)
}

const formattedName = computed(() => props.name.replace(/-/g, ' '))
const spriteSources = computed(() => ({
  artwork: props.spriteUrl ?? getOfficialArtworkUrl(props.id),
  fallback: getFallbackSpriteUrl(props.id),
}))

onMounted(() => {
  cacheSpriteAsset(spriteSources.value.artwork)
})

watch(
  () => spriteSources.value.artwork,
  (url) => {
    cacheSpriteAsset(url)
  },
)

function handleImageError(event: Event) {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === 'true') {
    return
  }
  target.dataset.fallbackApplied = 'true'
  target.src = spriteSources.value.fallback
}
</script>

<template>
  <RouterLink
    class="group relative flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
    :to="{ name: 'pokemon-detail', params: { identifier: id } }"
  >
    <div class="flex items-center justify-center">
      <img
        class="h-32 w-32 object-contain transition group-hover:scale-105"
        :src="spriteSources.artwork || spriteSources.fallback"
        :alt="`${formattedName} artwork`"
        width="128"
        height="128"
        loading="lazy"
        decoding="async"
        fetchpriority="low"
        sizes="(max-width: 768px) 40vw, 180px"
        @error="handleImageError"
      />
      <button
        class="absolute right-2 top-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-xl shadow-sm transition hover:scale-105"
        :aria-pressed="isFavorite"
        @click="toggleFavorite"
      >
        <span v-if="isFavorite" aria-hidden="true">★</span>
        <span v-else aria-hidden="true">☆</span>
        <span class="sr-only">Toggle favorite</span>
      </button>
    </div>
    <div class="text-center">
      <p class="text-xs uppercase tracking-[0.35em] text-slate-500">
        #{{ id.toString().padStart(3, '0') }}
      </p>
      <h3 class="mt-2 text-xl font-semibold capitalize">{{ formattedName }}</h3>
      <p v-if="description" class="mt-1 text-sm text-slate-500">
        {{ description }}
      </p>
    </div>
  </RouterLink>
</template>
