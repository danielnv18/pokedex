import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/views/LandingPage.vue'
import { APP_NAME } from '@/lib/constants/app'

const PokemonIndexView = () => import('@/views/PokemonIndexView.vue')
const PokemonDetailView = () => import('@/views/PokemonDetailView.vue')
const SearchResultsView = () => import('@/views/SearchResultsView.vue')
const FavoritesView = () => import('@/views/FavoritesView.vue')
const TypeDetailView = () => import('@/views/TypeDetailView.vue')
const AbilityDetailView = () => import('@/views/AbilityDetailView.vue')
const MovesExplorerView = () => import('@/views/MovesExplorerView.vue')
const LocationsView = () => import('@/views/LocationsView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LandingPage,
      meta: { title: 'Home' },
    },
    {
      path: '/pokemon',
      name: 'pokemon-index',
      component: PokemonIndexView,
      meta: { title: 'Pokémon Index' },
    },
    {
      path: '/pokemon/:identifier',
      name: 'pokemon-detail',
      component: PokemonDetailView,
      meta: { title: titleWithIdentifier('Pokémon') },
    },
    {
      path: '/type/:identifier',
      name: 'type-detail',
      component: TypeDetailView,
      meta: { title: titleWithIdentifier('Type') },
    },
    {
      path: '/ability/:identifier',
      name: 'ability-detail',
      component: AbilityDetailView,
      meta: { title: titleWithIdentifier('Ability') },
    },
    {
      path: '/search',
      name: 'search',
      component: SearchResultsView,
      meta: { title: 'Search' },
    },
    {
      path: '/moves',
      name: 'moves',
      component: MovesExplorerView,
      meta: { title: 'Moves' },
    },
    {
      path: '/locations',
      name: 'locations',
      component: LocationsView,
      meta: { title: 'Locations' },
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
      meta: { title: 'Favorites' },
    },
  ],
})

router.afterEach((to) => {
  document.title = formatDocumentTitle(to)
})

function formatDocumentTitle(to: RouteLocationNormalizedLoaded): string {
  const title = resolveRouteTitle(to)
  return title ? `${title} • ${APP_NAME}` : APP_NAME
}

function resolveRouteTitle(to: RouteLocationNormalizedLoaded): string {
  const metaTitle = to.meta?.title

  if (typeof metaTitle === 'function') {
    return metaTitle(to) ?? ''
  }

  if (typeof metaTitle === 'string') {
    return metaTitle
  }

  return ''
}

function titleWithIdentifier(prefix: string) {
  return (route: RouteLocationNormalizedLoaded) => {
    const identifier = route.params.identifier

    if (Array.isArray(identifier)) {
      return identifier.length ? `${prefix} ${identifier.join(', ')}` : prefix
    }

    if (typeof identifier === 'string' && identifier.trim().length > 0) {
      return `${prefix} ${identifier}`
    }

    return prefix
  }
}

export default router
