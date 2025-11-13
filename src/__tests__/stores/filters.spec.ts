import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useFiltersStore } from '@/stores/filters'

describe('useFiltersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('tracks active filters and dirty state', () => {
    const store = useFiltersStore()
    expect(store.activeFiltersCount).toBe(0)
    expect(store.isDirty).toBe(false)

    store.setSearchQuery('pikachu')
    store.toggleType('electric')
    expect(store.activeFiltersCount).toBe(2)
    expect(store.isDirty).toBe(true)

    store.markApplied()
    expect(store.isDirty).toBe(false)
  })

  it('resets pagination offset whenever filters change', () => {
    const store = useFiltersStore()
    store.setPagination({ limit: 40, offset: 80 })
    expect(store.pagination.offset).toBe(80)

    store.toggleType('fire')
    expect(store.pagination.offset).toBe(0)

    store.setGenerations(['gen-1', 'gen-2'])
    expect(store.pagination.offset).toBe(0)
  })
})
