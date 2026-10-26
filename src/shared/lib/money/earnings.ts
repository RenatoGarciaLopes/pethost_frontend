/** Parte da PetHost em cada estadia (escopo: a PetHost fica com 10%, o anfitrião com 90%). */
export const PLATFORM_FEE_PERCENT = 10;

/**
 * Divide o total de uma estadia (REQ-LIST-009, REQ-HREQ-002): a parte da PetHost é arredondada para o centavo e o
 * anfitrião fica com o resto, então as duas partes sempre somam o total.
 *
 * @param grossCents total da estadia, em centavos
 * @example splitEarnings(30000) // { feeCents: 3000, netCents: 27000 }
 */
export function splitEarnings(grossCents: number): { feeCents: number; netCents: number } {
  const feeCents = Math.round((grossCents * PLATFORM_FEE_PERCENT) / 100);
  return { feeCents, netCents: grossCents - feeCents };
}

/**
 * Quanto o anfitrião recebe de verdade (REQ-LIST-009): diária × pets × noites, menos os 10% da PetHost, em centavos.
 *
 * @param rateCents diária por pet, em centavos
 * @example netEarnings(6000, 2, 10) // 108000 (R$ 1.080,00)
 */
export function netEarnings(rateCents: number, pets: number, nights: number): number {
  return splitEarnings(rateCents * pets * nights).netCents;
}
