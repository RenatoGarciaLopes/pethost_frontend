/** As 27 UFs, em ordem alfabética (mesma lista do `StateCode` da API). */
export const BRAZIL_STATES = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO",
] as const;

/** Limites do `Address` da API (caracteres). O CEP tem sempre 8 dígitos. */
export const ADDRESS_LIMITS = { street: 120, number: 10, complement: 60, neighborhood: 80, city: 80 } as const;
