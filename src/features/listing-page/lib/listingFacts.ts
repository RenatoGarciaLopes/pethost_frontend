import type { ListingDetail } from "../api/contracts";
import { listingPageCopy as copy } from "./listingPageCopy";

type HouseFacts = Pick<ListingDetail, "homeType" | "hasYard" | "hasDogs" | "hasCats" | "hasKids">;
type RuleFacts = Pick<
  ListingDetail,
  | "houseRules"
  | "acceptedSpecies"
  | "acceptsSmall"
  | "acceptsMedium"
  | "acceptsLarge"
  | "capacity"
  | "availableWeekdays"
>;

const list = new Intl.ListFormat("pt-BR", { style: "long", type: "conjunction" });

/**
 * A casa em poucas palavras, para a linha embaixo do título: tipo, quintal e quem mora lá.
 * @example houseLine({ homeType: "house", hasYard: true, hasDogs: true, hasCats: false, hasKids: false }) // "casa com quintal · tem cachorro"
 */
export function houseLine(listing: HouseFacts): string {
  const home = listing.homeType ? copy.homeType[listing.homeType] : undefined;
  const yard = listing.hasYard ? copy.withYard : undefined;
  return [
    [home, yard].filter(Boolean).join(" "),
    listing.hasDogs && copy.hasDogs,
    listing.hasCats && copy.hasCats,
    listing.hasKids && copy.hasKids,
  ]
    .filter(Boolean)
    .join(" · ");
}

/**
 * Itens de "Regras da casa": cada linha das regras escritas pelo anfitrião (sem marcador) e, depois, o que a casa
 * aceita, quantos pets por vez e os dias em que recebe.
 * @example houseRuleItems(listing) // ["Pode subir no sofá", "Recebe cachorro, de porte pequeno", "Até 2 pets por vez", …]
 */
export function houseRuleItems(listing: RuleFacts): string[] {
  const written = (listing.houseRules ?? "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, "").trim())
    .filter(Boolean);
  const sizes = [
    listing.acceptsSmall && copy.sizeLabels.small,
    listing.acceptsMedium && copy.sizeLabels.medium,
    listing.acceptsLarge && copy.sizeLabels.large,
  ].filter((size): size is string => Boolean(size));
  const species = listing.acceptedSpecies.map((code) => copy.speciesLabels[code] ?? code);
  return [
    ...written,
    ...(species.length ? [copy.rules.accepts(list.format(species), list.format(sizes))] : []),
    copy.rules.capacity(listing.capacity),
    ...(listing.availableWeekdays.length
      ? [copy.rules.weekdays(list.format(listing.availableWeekdays.map((day) => copy.weekdayLabels[day] ?? day)))]
      : []),
  ];
}

/**
 * Por que o pet combina, a partir do que a casa informa (a API só manda os avisos): o tipo e o porte aceitos e quem
 * mora lá. Só faz sentido quando a compatibilidade da API não trouxe aviso.
 * @example compatibilityReasons(listing, { species: "dog", size: "medium" }) // ["aceita cachorro de porte médio", "tem cachorro em casa", "sem gato em casa"]
 */
export function compatibilityReasons(
  listing: Pick<ListingDetail, "hasDogs" | "hasCats" | "hasKids">,
  pet: { species: string; size: string | null },
): string[] {
  return [
    copy.reasons.accepts(
      copy.speciesLabels[pet.species] ?? pet.species,
      pet.size ? (copy.sizeLabels[pet.size] ?? pet.size) : null,
    ),
    copy.reasons.dogs(listing.hasDogs),
    copy.reasons.cats(listing.hasCats),
    ...(listing.hasKids ? [copy.reasons.kids] : []),
  ];
}
