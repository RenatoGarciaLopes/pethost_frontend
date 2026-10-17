import { z } from "zod";
import { nightsBetween } from "@/shared/lib/date/stayRules";
import type { SearchPet, SearchQuery } from "../types";
import { listingSpeciesSchema } from "../api/contracts";

const SPECIES = listingSpeciesSchema.options;
const SIZES = ["small", "medium", "large"];
const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
type Params = URLSearchParams | Record<string, string | string[] | undefined>;

function numberValue(value: string | null, min: number, max = Number.MAX_SAFE_INTEGER, integer = false) {
  if (value === null || !value.trim()) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number))
    ? number
    : undefined;
}

/**
 * Único parser da URL da busca. Ignora valores inválidos e listas desconhecidas.
 * Datas existentes são preservadas para a validação da estadia no campo.
 * @example searchParamsToQuery(new URLSearchParams("where=Maringá&hasKids=false"))
 */
export function searchParamsToQuery(input: Params): SearchQuery {
  const params = input instanceof URLSearchParams ? input : new URLSearchParams();
  if (!(input instanceof URLSearchParams))
    Object.entries(input).forEach(([key, value]) => {
      for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) params.append(key, item);
    });
  const list = (key: string, allowed?: string[]) => [
    ...new Set(
      params
        .getAll(key)
        .flatMap((value) => value.split(","))
        .filter((value) => (allowed ? allowed.includes(value) : z.string().uuid().safeParse(value).success)),
    ),
  ];
  const result: SearchQuery = {
    pets: list("pets"),
    species: list("species", SPECIES),
    sizes: list("sizes", SIZES),
    weekdays: list("weekdays", WEEKDAYS),
  };
  for (const key of ["where", "neighborhood"] as const) {
    const value = params.get(key)?.trim();
    if (value && value.length <= 80) result[key] = value;
  }
  const state = params.get("state")?.toUpperCase();
  if (state && /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/.test(state))
    result.state = state;
  for (const key of ["from", "to"] as const) {
    const value = params.get(key);
    if (value && Number.isFinite(nightsBetween(value, value))) result[key] = value;
  }
  for (const key of ["hasYard", "hasKids", "hasDogs", "hasCats"] as const) {
    const value = params.get(key);
    if (value === "true" || value === "false") result[key] = value === "true";
  }
  const homeType = params.get("homeType");
  if (homeType === "house" || homeType === "apartment") result.homeType = homeType;
  for (const [key, min, max, integer] of [
    ["radius", 5, 50, true],
    ["count", 1, 200, true],
    ["minCapacity", 1, 200, true],
    ["minNightlyRate", 0, Number.MAX_SAFE_INTEGER, false],
    ["maxNightlyRate", 0, Number.MAX_SAFE_INTEGER, false],
  ] as const) {
    const value = numberValue(params.get(key), min, max, integer);
    if (value !== undefined) result[key] = value;
  }
  return result;
}

/** Serializa apenas o estado conhecido. Listas repetem a chave. @example queryToSearchParams(query).toString() */
export function queryToSearchParams(query: SearchQuery): URLSearchParams {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined && value !== "") params.set(key, String(value));
  });
  return params;
}

/** Traduz URL para os filtros da API, derivando somente dos pets ativos conhecidos. @example toApiSearch(query, pets, 1) */
export function toApiSearch(query: SearchQuery, pets: SearchPet[], page: number) {
  const selected = pets.filter((pet) => query.pets.includes(pet.id));
  const { where, from, to, radius, count, pets: _ids, ...filters } = query;
  void _ids;
  return {
    ...filters,
    city: where,
    checkIn: from,
    checkOut: to,
    radiusKm: radius ?? (where || query.state || query.neighborhood ? undefined : 10),
    pets: selected.length || count || 1,
    species: [...new Set([...query.species, ...selected.map((pet) => pet.species)])],
    sizes: [...new Set([...query.sizes, ...selected.flatMap((pet) => (pet.size ? [pet.size] : []))])],
    page,
    pageSize: 12,
  };
}
