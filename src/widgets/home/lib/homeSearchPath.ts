export type HomePetSpecies = "dog" | "cat";

export interface HomeSearchPathOptions {
  /** Cidade/bairro ou endereço vazio para procurar perto de casa. */
  where?: string;
  /** Chegada no formato yyyy-MM-dd. */
  from?: string;
  /** Saída no formato yyyy-MM-dd. */
  to?: string;
  /** Pets ativos escolhidos pelo tutor; cada id vira um parâmetro `pets`. */
  petIds?: readonly string[];
  /** Espécies para quem ainda não cadastrou pet. */
  species?: readonly HomePetSpecies[];
  /** Quantidade informada por anfitrião, conforme o contrato da busca. */
  petCount?: number;
}

/**
 * Monta o handoff da home para a busca, sem nome, foto ou dado privado na URL (REQ-HOME-005).
 * Não envia a chamada de busca; a spec 041 interpreta estes parâmetros.
 * @example buildHomeSearchPath({ where: "Maringá", petIds: ["pet-1"] })
 */
export function buildHomeSearchPath({
  where,
  from,
  to,
  petIds = [],
  species = [],
  petCount,
}: HomeSearchPathOptions): string {
  const params = new URLSearchParams();
  const location = where?.trim();
  if (location) params.set("where", location);
  if (from) params.set("from", from);
  if (to) params.set("to", to);

  if (petCount !== undefined) params.set("pets", String(petCount));
  else petIds.filter(Boolean).forEach((petId) => params.append("pets", petId));
  species.filter(Boolean).forEach((item) => params.append("species", item));

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}
