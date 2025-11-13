<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <RouterLink class="brand" to="/">
        <span class="brand__dot" aria-hidden="true"></span>
        Pokedex
      </RouterLink>
      <nav class="app-nav">
        <RouterLink to="/pokemon">Pokédex</RouterLink>
        <RouterLink to="/search">Search</RouterLink>
        <RouterLink to="/favorites">Favorites</RouterLink>
      </nav>
    </header>
    <main class="app-main">
      <RouterView />
    </main>
    <footer class="app-footer">Powered by PokéAPI</footer>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 30%);
}

.app-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.brand {
  font-weight: 700;
  font-size: 1.125rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: #0f172a;
}

.brand__dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

.app-nav {
  display: flex;
  gap: 1rem;
}

.app-nav a {
  text-decoration: none;
  color: #475569;
  font-weight: 500;
}

.app-nav a.router-link-active {
  color: #2563eb;
}

.app-main {
  flex: 1;
}

.app-footer {
  text-align: center;
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  color: #94a3b8;
  font-size: 0.875rem;
}
</style>
