import { defineStore } from 'pinia'

interface FavoritesState {
  ids: number[]
  teamSlots: Array<number | null>
  hydrated: boolean
}

const STORAGE_KEY = 'pokedex:favorites'
const TEAM_STORAGE_KEY = 'pokedex:team'

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

function safeReadTeam(): Array<number | null> {
  if (typeof window === 'undefined') {
    return Array(6).fill(null)
  }
  try {
    const raw = window.localStorage.getItem(TEAM_STORAGE_KEY)
    const parsed = raw ? (JSON.parse(raw) as Array<number | null>) : []
    const slots = Array(6)
      .fill(null)
      .map((_, index) => parsed[index] ?? null)
    return slots
  } catch (error) {
    console.warn('Failed to parse team from storage', error)
    return Array(6).fill(null)
  }
}

function safeWriteTeam(slots: Array<number | null>) {
  if (typeof window === 'undefined') {
    return
  }
  try {
    window.localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(slots))
  } catch (error) {
    console.warn('Failed to persist team to storage', error)
  }
}

export const useFavoritesStore = defineStore('favorites', {
  state: (): FavoritesState => ({
    ids: [],
    teamSlots: Array(6).fill(null),
    hydrated: false,
  }),
  getters: {
    total(state) {
      return state.ids.length
    },
    isFavorite: (state) => (id: number) => state.ids.includes(id),
    team(state) {
      return state.teamSlots
    },
  },
  actions: {
    hydrate() {
      if (this.hydrated) return
      this.ids = safeRead()
      this.teamSlots = safeReadTeam()
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
    addToTeam(id: number) {
      this.hydrate()
      if (this.teamSlots.includes(id)) {
        return
      }
      const next = [...this.teamSlots]
      const emptyIndex = next.findIndex((slot) => slot === null)
      if (emptyIndex !== -1) {
        next[emptyIndex] = id
      } else {
        next[next.length - 1] = id
      }
      this.teamSlots = next
      safeWriteTeam(this.teamSlots)
    },
    setTeamSlot(index: number, value: number | null) {
      this.hydrate()
      if (index < 0 || index >= this.teamSlots.length) return
      const next = [...this.teamSlots]
      next[index] = value
      this.teamSlots = next
      safeWriteTeam(this.teamSlots)
    },
    swapTeamSlots(from: number, to: number) {
      this.hydrate()
      if (
        from < 0 ||
        from >= this.teamSlots.length ||
        to < 0 ||
        to >= this.teamSlots.length ||
        from === to
      ) {
        return
      }
      const next = [...this.teamSlots]
      const temp = next[from] ?? null
      next[from] = next[to] ?? null
      next[to] = temp
      this.teamSlots = next
      safeWriteTeam(this.teamSlots)
    },
    clearTeam() {
      this.hydrate()
      this.teamSlots = Array(6).fill(null)
      safeWriteTeam(this.teamSlots)
    },
  },
})
