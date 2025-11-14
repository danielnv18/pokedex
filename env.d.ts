/// <reference types="vite/client" />

import type { RouteLocationNormalizedLoaded } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string | ((route: RouteLocationNormalizedLoaded) => string)
  }
}
