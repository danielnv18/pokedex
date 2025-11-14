import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/views/LandingPage.vue'

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
    },
    {
      path: '/pokemon',
      name: 'pokemon-index',
      component: PokemonIndexView,
    },
    {
      path: '/pokemon/:identifier',
      name: 'pokemon-detail',
      component: PokemonDetailView,
    },
    {
      path: '/type/:identifier',
      name: 'type-detail',
      component: TypeDetailView,
    },
    {
      path: '/ability/:identifier',
      name: 'ability-detail',
      component: AbilityDetailView,
    },
    {
      path: '/search',
      name: 'search',
      component: SearchResultsView,
    },
    {
      path: '/moves',
      name: 'moves',
      component: MovesExplorerView,
    },
    {
      path: '/locations',
      name: 'locations',
      component: LocationsView,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
    },
  ],
})

export default router
