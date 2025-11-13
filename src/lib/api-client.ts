import type { EvolutionChain, Pokemon, PokemonSpecies, PokemonType } from '@/lib/types'

const BASE_URL = 'https://pokeapi.co/api/v2'

export class ApiError extends Error {
  status: number
  statusText: string
  url: string

  constructor(message: string, options: { status: number; statusText: string; url: string }) {
    super(message)
    this.name = 'ApiError'
    this.status = options.status
    this.statusText = options.statusText
    this.url = options.url
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = buildUrl(path)
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    const body = await safeParseBody(response)
    const message =
      body && typeof body === 'object' && 'detail' in body
        ? String(body.detail)
        : response.statusText

    throw new ApiError(message, {
      status: response.status,
      statusText: response.statusText,
      url,
    })
  }

  return (await response.json()) as T
}

function buildUrl(path: string): string {
  if (path.startsWith('http')) {
    return path
  }

  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${BASE_URL}${normalized}`
}

async function safeParseBody(response: Response): Promise<unknown | null> {
  try {
    return await response.clone().json()
  } catch (error) {
    console.warn('Failed to parse error response body', error)
    return null
  }
}

export function fetchPokemon(identifier: number | string): Promise<Pokemon> {
  return request<Pokemon>(`/pokemon/${identifier}`)
}

export function fetchPokemonSpecies(identifier: number | string): Promise<PokemonSpecies> {
  return request<PokemonSpecies>(`/pokemon-species/${identifier}`)
}

export function fetchPokemonType(identifier: number | string): Promise<PokemonType> {
  return request<PokemonType>(`/type/${identifier}`)
}

export function fetchEvolutionChain(identifier: number | string): Promise<EvolutionChain> {
  return request<EvolutionChain>(`/evolution-chain/${identifier}`)
}

export interface PaginatedResult<TItem> {
  count: number
  next: string | null
  previous: string | null
  results: TItem[]
}

export function fetchPokemonList(params: { limit?: number; offset?: number } = {}) {
  const search = new URLSearchParams()
  if (typeof params.limit === 'number') {
    search.set('limit', String(params.limit))
  }
  if (typeof params.offset === 'number') {
    search.set('offset', String(params.offset))
  }

  const query = search.toString()
  const path = query ? `/pokemon?${query}` : '/pokemon'
  return request<PaginatedResult<{ name: string; url: string }>>(path)
}
