const SPRITE_CACHE_NAME = 'pokemon-sprites-v1'

export function getOfficialArtworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

export function getFallbackSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export async function cacheSpriteAsset(url: string | null | undefined) {
  if (!url || typeof window === 'undefined' || !('caches' in window)) {
    return
  }
  try {
    const cache = await window.caches.open(SPRITE_CACHE_NAME)
    const existing = await cache.match(url)
    if (existing) {
      return
    }
    const response = await fetch(url, { mode: 'cors', cache: 'force-cache' })
    if (response.ok) {
      await cache.put(url, response.clone())
    }
  } catch (error) {
    console.warn('Failed to cache sprite', error)
  }
}
