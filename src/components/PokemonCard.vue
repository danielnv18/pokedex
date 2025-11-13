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
  <RouterLink class="pokemon-card" :to="{ name: 'pokemon-detail', params: { identifier: id } }">
    <div class="pokemon-card__media">
      <img
        class="pokemon-card__image"
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
      <button class="favorite" :aria-pressed="isFavorite" @click="toggleFavorite">
        <span v-if="isFavorite" aria-hidden="true">★</span>
        <span v-else aria-hidden="true">☆</span>
        <span class="sr-only">Toggle favorite</span>
      </button>
    </div>
    <div class="pokemon-card__body">
      <p class="pokemon-card__id">#{{ id.toString().padStart(3, '0') }}</p>
      <h3>{{ formattedName }}</h3>
      <p v-if="description" class="pokemon-card__desc">
        {{ description }}
      </p>
    </div>
  </RouterLink>
</template>

<style scoped>
.pokemon-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  border-radius: 1rem;
  border: 1px solid #e2e8f0;
  padding: 1rem;
  background: #fff;
  text-decoration: none;
  color: inherit;
  position: relative;
  transition:
    transform 150ms ease,
    box-shadow 150ms ease;
}

.pokemon-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.pokemon-card__media {
  display: flex;
  justify-content: center;
  position: relative;
}

.pokemon-card__image {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.favorite {
  position: absolute;
  right: 0.25rem;
  top: 0.25rem;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  width: 2.25rem;
  height: 2.25rem;
  display: grid;
  place-items: center;
  font-size: 1.25rem;
  cursor: pointer;
}

.pokemon-card__body {
  text-align: center;
}

.pokemon-card__id {
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: #94a3b8;
}

h3 {
  margin: 0.25rem 0;
  text-transform: capitalize;
  font-size: 1.1rem;
  color: #0f172a;
}

.pokemon-card__desc {
  font-size: 0.9rem;
  color: #475569;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
</style>
