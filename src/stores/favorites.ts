import { defineStore } from 'pinia'

interface FavoritesState {
  ids: number[]
  hydrated: boolean
}

const STORAGE_KEY = 'pokedex:favorites'

function safeRead(): number[] {
  if (typeof window === 'undefined') {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch (error) {
    console.warn('Failed to parse favorites from storage', error)
    return []
  }
}

function safeWrite(ids: number[]) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch (error) {
    console.warn('Failed to persist favorites to storage', error)
  }
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    ids: [],
    hydrated: false,
  }),
  getters: {
    total(state) {
      return state.ids.length
    },
    isFavorite: (state) => (id: number) => state.ids.includes(id),
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      this.ids = safeRead()
      this.hydrated = true
    },
    toggle(id: number) {
      this.hydrate()
      if (this.ids.includes(id)) {
        this.ids = this.ids.filter((value) => value !== id)
      } else {
        this.ids = [...this.ids, id]
      }
      safeWrite(this.ids)
    },
    remove(id: number) {
      this.hydrate()
      this.ids = this.ids.filter((value) => value !== id)
      safeWrite(this.ids)
    },
    clear() {
      this.hydrate()
      this.ids = []
      safeWrite(this.ids)
    },
  },
})
