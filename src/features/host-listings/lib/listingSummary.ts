import { formatBRL, fromCents, netEarnings } from "@/shared/lib/money";
import { formCopy } from "@/shared/ui/forms/formCopy";
import { WEEKDAY_VALUES } from "@/shared/ui/forms/WeekdayPicker/weekdays";
import { LISTING_SPECIES } from "../api/contracts";
import { parseRateCents, type ListingFormValues } from "../schemas/listingSchema";
import type { HomeType, ListingSpecies } from "../types";
import { listingCopy } from "./listingCopy";
import type { ListingStepId } from "./listingSteps";

const copy = listingCopy.review;

/** "a, b e c". */
function joinWords(words: readonly string[]): string {
  return words.length <= 1 ? (words[0] ?? "") : `${words.slice(0, -1).join(", ")} e ${words.at(-1)}`;
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const yesNo = (value: boolean | null, labels: { yes: string; no: string }) => (value ? labels.yes : labels.no);

/**
 * Os bichos aceitos em minúsculas, na ordem da API ("cachorro, gato e coelho"); vazio sem nenhum.
 * @example acceptedSpeciesText(["cat", "dog"]) // "cachorro e gato"
 */
export function acceptedSpeciesText(species: readonly string[]): string {
  return joinWords(
    LISTING_SPECIES.filter((item) => species.includes(item)).map((item: ListingSpecies) =>
      listingCopy.species[item].toLowerCase(),
    ),
  );
}

/** "1 pet por vez" ou "até 3 pets por vez". */
export const capacityText = (capacity: number) => copy.capacity(capacity);

/**
 * A diária digitada em reais ("R$ 60,00") e o líquido de uma noite (90%), ou `null` se ainda não é um valor.
 * @example rateTexts("60,00") // { rate: "R$ 60,00", net: "R$ 54,00" }
 */
export function rateTexts(text: string): { rate: string; net: string } | null {
  const cents = parseRateCents(text);
  if (cents === null) return null;
  return { rate: formatBRL(fromCents(cents)), net: formatBRL(fromCents(netEarnings(cents, 1, 1))) };
}

/**
 * Uma linha por passo da revisão (104), no tom das seções da prancha: "Casa · com quintal", "Cachorro e gato · porte
 * P e M · até 2 pets por vez". O endereço aparece inteiro (é a revisão do dono), com o lembrete de que o tutor só vê o
 * bairro.
 *
 * @example listingSummary(values).home // "Casa · com quintal"
 */
export function listingSummary(values: ListingFormValues): Record<Exclude<ListingStepId, "review">, string> {
  const homeType = values.homeType ? listingCopy.homeTypes[values.homeType as HomeType] : null;
  const catOrDog = values.acceptedSpecies.includes("dog") || values.acceptedSpecies.includes("cat");
  const sizes = [values.acceptsSmall && "P", values.acceptsMedium && "M", values.acceptsLarge && "G"].filter(
    (size): size is string => Boolean(size),
  );
  const { address } = values;
  const days = WEEKDAY_VALUES.filter((day) => values.availableWeekdays.includes(day));
  const rate = rateTexts(values.nightlyRate);
  return {
    home: capitalize([homeType, values.hasYard ? copy.withYard : copy.withoutYard].filter(Boolean).join(" · ")),
    title: values.title.trim(),
    household: [
      yesNo(values.hasDogs, copy.household.dogs),
      yesNo(values.hasCats, copy.household.cats),
      yesNo(values.hasKids, copy.household.kids),
    ].join(" · "),
    guests: [
      capitalize(acceptedSpeciesText(values.acceptedSpecies)),
      catOrDog && sizes.length > 0 ? copy.sizes(joinWords(sizes)) : null,
      capacityText(values.capacity),
    ]
      .filter(Boolean)
      .join(" · "),
    address: [
      [address.street, address.number].filter(Boolean).join(", "),
      address.neighborhood,
      [address.city, address.state].filter(Boolean).join("/"),
    ]
      .filter(Boolean)
      .join(" · "),
    rules: values.houseRules.trim() || copy.noRules,
    weekdays:
      days.length === WEEKDAY_VALUES.length
        ? formCopy.allWeekdays
        : joinWords(days.map((day) => formCopy.weekdaysShort[day])),
    rate: rate ? copy.rate(rate.rate, rate.net) : "",
  };
}
