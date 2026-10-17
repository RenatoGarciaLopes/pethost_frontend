import { nightsBetween } from "@/shared/lib/date/stayRules";
import { formatBRL, fromCents, toCents } from "@/shared/lib/money";

/** Total por pet, noites e diária; devolve nulo sem período válido ou quantidade positiva. */
export function stayTotal(nightlyRate: number, checkIn?: string, checkOut?: string, petCount = 0): string | null {
  if (!checkIn || !checkOut || petCount < 1) return null;
  const nights = nightsBetween(checkIn, checkOut);
  if (!Number.isInteger(nights) || nights < 1) return null;
  return formatBRL(fromCents(toCents(nightlyRate) * nights * petCount));
}
