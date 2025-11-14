<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-slate-50">
    <header
      class="sticky top-0 z-20 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 lg:px-10"
    >
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-6">
        <RouterLink class="inline-flex items-center gap-3 text-lg font-semibold" to="/">
          <span
            aria-hidden="true"
            class="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_0_6px_rgba(239,68,68,0.25)]"
          ></span>
          Pokedex
        </RouterLink>
        <nav class="flex items-center gap-3 text-sm font-medium text-slate-500">
          <RouterLink
            to="/pokemon"
            class="rounded-full px-3 py-1 transition hover:text-slate-900"
            active-class="text-slate-900 bg-slate-100"
          >
            Pokédex
          </RouterLink>
          <RouterLink
            to="/search"
            class="rounded-full px-3 py-1 transition hover:text-slate-900"
            active-class="text-slate-900 bg-slate-100"
          >
            Search
          </RouterLink>
          <RouterLink
            to="/moves"
            class="rounded-full px-3 py-1 transition hover:text-slate-900"
            active-class="text-slate-900 bg-slate-100"
          >
            Moves
          </RouterLink>
          <RouterLink
            to="/locations"
            class="rounded-full px-3 py-1 transition hover:text-slate-900"
            active-class="text-slate-900 bg-slate-100"
          >
            Locations
          </RouterLink>
          <RouterLink
            to="/favorites"
            class="rounded-full px-3 py-1 transition hover:text-slate-900"
            active-class="text-slate-900 bg-slate-100"
          >
            Favorites
          </RouterLink>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <RouterView />
    </main>
    <footer class="border-t border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
      Powered by PokéAPI
    </footer>
  </div>
</template>
