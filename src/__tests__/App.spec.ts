import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'

import App from '@/App.vue'

describe('App shell', () => {
  it('renders navigation links and footer', () => {
    const wrapper = mount(App, {
      global: {
        stubs: {
          RouterLink: {
            template: '<a><slot /></a>',
          },
          RouterView: {
            template: '<div class="stub-view">Stub</div>',
          },
        },
      },
    })

    expect(wrapper.find('.brand').text()).toContain('Pokedex')
    expect(wrapper.text()).toContain('Pokédex')
    expect(wrapper.text()).toContain('Search')
    expect(wrapper.text()).toContain('Favorites')
    expect(wrapper.text()).toContain('Powered by PokéAPI')
  })
})
