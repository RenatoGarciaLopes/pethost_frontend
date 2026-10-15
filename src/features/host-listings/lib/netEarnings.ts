/** Parte da PetHost em cada estadia (escopo: a PetHost fica com 10%, o anfitrião com 90%). */
const PLATFORM_FEE_RATE = 0.1;

/**
 * Quanto o anfitrião recebe de verdade (REQ-LIST-009): diária × pets × noites, menos os 10% da PetHost, tudo em
 * centavos inteiros. A parte da PetHost é arredondada para o centavo e o anfitrião fica com o resto, então as duas
 * partes sempre somam o total.
 *
 * @param rateCents diária por pet, em centavos
 * @example netEarnings(6000, 2, 10) // 108000 (R$ 1.080,00)
 */
export function netEarnings(rateCents: number, pets: number, nights: number): number {
  const gross = rateCents * pets * nights;
  return gross - Math.round(gross * PLATFORM_FEE_RATE);
}
