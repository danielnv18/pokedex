export interface NamedApiResource<TName extends string = string> {
  name: TName
  url: string
}

export interface PokemonAbility {
  is_hidden: boolean
  slot: number
  ability: NamedApiResource
}

export interface PokemonMoveVersionDetail {
  level_learned_at: number
  version_group: NamedApiResource
  move_learn_method: NamedApiResource
  order?: number | null
}

export interface PokemonMove {
  move: NamedApiResource
  version_group_details: PokemonMoveVersionDetail[]
}

export interface PokemonHeldItemVersion {
  rarity: number
  version: NamedApiResource
}

export interface PokemonHeldItem {
  item: NamedApiResource
  version_details: PokemonHeldItemVersion[]
}

export interface PokemonTypeSlot {
  slot: number
  type: NamedApiResource
}

export interface PokemonStat {
  base_stat: number
  effort: number
  stat: NamedApiResource
}

export interface PokemonSprites {
  back_default: string | null
  back_female: string | null
  back_shiny: string | null
  back_shiny_female: string | null
  front_default: string | null
  front_female: string | null
  front_shiny: string | null
  front_shiny_female: string | null
  other?: Record<string, unknown>
  versions?: Record<string, unknown>
}

export interface PokemonFormSummary {
  name: string
  url: string
}

export interface PokemonPastType {
  generation: NamedApiResource
  types: PokemonTypeSlot[]
}

export interface PokemonPastAbility {
  generation: NamedApiResource
  abilities: Array<{
    ability: NamedApiResource | null
    is_hidden: boolean
    slot: number
  }>
}

export interface PokemonGameIndex {
  game_index: number
  version: NamedApiResource
}

export interface Pokemon {
  id: number
  name: string
  base_experience: number
  height: number
  weight: number
  is_default: boolean
  order: number
  abilities: PokemonAbility[]
  forms: PokemonFormSummary[]
  game_indices: PokemonGameIndex[]
  held_items: PokemonHeldItem[]
  location_area_encounters: string
  moves: PokemonMove[]
  species: NamedApiResource
  sprites: PokemonSprites
  stats: PokemonStat[]
  types: PokemonTypeSlot[]
  past_types: PokemonPastType[]
  past_abilities: PokemonPastAbility[]
  cries?: {
    latest?: string
    legacy?: string
  }
}

export interface PokemonDexNumber {
  entry_number: number
  pokedex: NamedApiResource
}

export interface PokemonSpeciesFlavorText {
  flavor_text: string
  language: NamedApiResource
  version: NamedApiResource
}

export interface PokemonSpeciesGenus {
  genus: string
  language: NamedApiResource
}

export interface PokemonSpeciesVariety {
  is_default: boolean
  pokemon: NamedApiResource
}

export interface PokemonSpecies {
  id: number
  name: string
  order: number
  gender_rate: number
  capture_rate: number
  base_happiness: number
  is_baby: boolean
  is_legendary: boolean
  is_mythical: boolean
  hatch_counter: number
  has_gender_differences: boolean
  forms_switchable: boolean
  growth_rate: NamedApiResource
  pokedex_numbers: PokemonDexNumber[]
  egg_groups: NamedApiResource[]
  color: NamedApiResource
  shape: NamedApiResource
  evolves_from_species: NamedApiResource | null
  evolution_chain: {
    url: string
  }
  habitat: NamedApiResource | null
  generation: NamedApiResource
  names: Array<{
    name: string
    language: NamedApiResource
  }>
  flavor_text_entries: PokemonSpeciesFlavorText[]
  form_descriptions: Array<{
    description: string
    language: NamedApiResource
  }>
  genera: PokemonSpeciesGenus[]
  varieties: PokemonSpeciesVariety[]
}

export interface TypeDamageRelations {
  no_damage_to: NamedApiResource[]
  half_damage_to: NamedApiResource[]
  double_damage_to: NamedApiResource[]
  no_damage_from: NamedApiResource[]
  half_damage_from: NamedApiResource[]
  double_damage_from: NamedApiResource[]
}

export interface PokemonTypePastDamageRelation {
  generation: NamedApiResource
  damage_relations: TypeDamageRelations
}

export interface PokemonType {
  id: number
  name: string
  damage_relations: TypeDamageRelations
  past_damage_relations: PokemonTypePastDamageRelation[]
  game_indices: Array<{
    game_index: number
    generation: NamedApiResource
  }>
  generation: NamedApiResource
  move_damage_class: NamedApiResource
  names: Array<{
    name: string
    language: NamedApiResource
  }>
  pokemon: Array<{
    slot: number
    pokemon: NamedApiResource
  }>
  moves: NamedApiResource[]
}

export interface Move {
  id: number
  name: string
  accuracy: number | null
  power: number | null
  pp: number | null
  priority: number
  type: NamedApiResource
  damage_class: NamedApiResource
  effect_entries: Array<{
    effect: string
    short_effect: string
    language: NamedApiResource
  }>
}

export interface Item {
  id: number
  name: string
  cost: number
  sprites: {
    default: string | null
  }
  effect_entries: Array<{
    effect: string
    short_effect: string
    language: NamedApiResource
  }>
}

export interface PokemonEncounterMethodRate {
  chance: number
  method: NamedApiResource
}

export interface PokemonEncounterVersionDetail {
  max_chance: number
  encounter_details: Array<{
    chance: number
    condition_values: NamedApiResource[]
    max_level: number
    min_level: number
    method: NamedApiResource
  }>
  version: NamedApiResource
}

export interface PokemonEncounterArea {
  location_area: NamedApiResource
  version_details: PokemonEncounterVersionDetail[]
}

export interface EvolutionDetail {
  item: NamedApiResource | null
  trigger: NamedApiResource
  gender: number | null
  held_item: NamedApiResource | null
  known_move: NamedApiResource | null
  known_move_type: NamedApiResource | null
  location: NamedApiResource | null
  min_level: number | null
  min_happiness: number | null
  min_beauty: number | null
  min_affection: number | null
  needs_overworld_rain: boolean
  party_species: NamedApiResource | null
  party_type: NamedApiResource | null
  relative_physical_stats: number | null
  time_of_day: string
  trade_species: NamedApiResource | null
  turn_upside_down: boolean
}

export interface EvolutionChainLink {
  is_baby: boolean
  species: NamedApiResource
  evolution_details: EvolutionDetail[] | null
  evolves_to: EvolutionChainLink[]
}

export interface EvolutionChain {
  id: number
  baby_trigger_item: NamedApiResource | null
  chain: EvolutionChainLink
}

export interface FetchStatusMeta {
  isLoading: boolean
  hasError: boolean
  errorMessage: string | null
  updatedAt: number | null
}
