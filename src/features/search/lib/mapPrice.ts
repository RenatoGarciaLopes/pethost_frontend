import { formatBRL, fromCents, toCents } from "@/shared/lib/money";

/** Período e pets da busca; com eles o pino mostra o total, sem eles a diária. @example { nights: 5, petCount: 1 } */
interface MapStay {
  nights: number;
  petCount: number;
}

/**
 * Preço curto do pino: total da estadia em reais inteiros quando dá ("R$ 275"), senão a diária por pet.
 * Conta em centavos. @example mapPrice(55, { nights: 5, petCount: 1 }) // "R$ 275"
 */
export function mapPrice(nightlyRate: number, stay?: MapStay): string {
  const nights = stay?.nights ?? 0;
  const count = stay?.petCount ?? 0;
  const cents = nights > 0 && count > 0 ? toCents(nightlyRate) * nights * count : toCents(nightlyRate);
  return formatBRL(fromCents(cents)).replace(/,00$/, "");
}
