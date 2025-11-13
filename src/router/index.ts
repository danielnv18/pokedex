import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/views/LandingPage.vue'

const PokemonIndexView = () => import('@/views/PokemonIndexView.vue')
const PokemonDetailView = () => import('@/views/PokemonDetailView.vue')
const SearchResultsView = () => import('@/views/SearchResultsView.vue')
const FavoritesView = () => import('@/views/FavoritesView.vue')

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
      path: '/search',
      name: 'search',
      component: SearchResultsView,
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: FavoritesView,
    },
  ],
})

export default router
