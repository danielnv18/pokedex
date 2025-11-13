# Pokedex

Vue 3 + Vite application that turns the [PokéAPI v2](https://pokeapi.co/docs/v2) into an interactive Pokédex. It focuses on fast client-side navigation, search, and filtering so you can quickly explore Pokémon data such as types, abilities, stats, and evolution chains.

## Features

- Vue Router-powered navigation between Pokémon detail views and list pages.
- Pinia stores to cache PokéAPI responses and keep the UI reactive.
- Reusable UI components for cards, stats, and filters.
- First-class TypeScript support with `vue-tsc` and ESLint/Prettier automation.

## Tech Stack

- [Vue 3](https://vuejs.org/) + [Vite](https://vite.dev/) for the SPA shell.
- [Pinia](https://pinia.vuejs.org/) for state management.
- [Vue Router](https://router.vuejs.org/) for client-side routing.
- [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/) for automated tests.

## Getting Started

### Prerequisites

- Node.js 20.19+ (or 22.12+)
- [pnpm](https://pnpm.io/) 8+

### Installation

```bash
pnpm install
```

### Run the Development Server

```bash
pnpm dev
```

The app will be served on the URL Vite prints to the console (defaults to `http://localhost:5173`).

### Type Check, Build, and Preview

```bash
pnpm type-check   # optional: run before the build for faster feedback
pnpm build        # output goes to dist/
pnpm preview      # serve the production build locally
```

### Testing and Linting

```bash
pnpm lint         # ESLint + Prettier formatting
pnpm test:unit    # Vitest unit suite
pnpm test:e2e     # Playwright end-to-end tests (run `npx playwright install` once)
```

## PokéAPI Usage

All Pokémon data is fetched from the public [PokéAPI v2](https://pokeapi.co/docs/v2). Make sure to respect their rate limits when building new features or running automated tests.

## License

Distributed under the [MIT License](./LICENSE).
