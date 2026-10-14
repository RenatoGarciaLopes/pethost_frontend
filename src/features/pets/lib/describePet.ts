import type { Pet, PetSize, PetSpecies } from "../types";

const SPECIES: Readonly<Record<Exclude<PetSpecies, "exotic">, string>> = {
  dog: "Cachorro",
  cat: "Gato",
  cockatiel: "Calopsita",
  parrot: "Papagaio",
  parakeet: "Periquito",
  canary: "Canário",
  rabbit: "Coelho",
  hamster: "Hamster",
  guinea_pig: "Porquinho-da-índia",
  fish: "Peixe",
  turtle: "Tartaruga ou jabuti",
};
const SIZES: Readonly<Record<PetSize, string>> = {
  small: "porte pequeno",
  medium: "porte médio",
  large: "porte grande",
};

/**
 * Nome da espécie; exótico usa a descrição da pessoa ("Iguana verde").
 * @example speciesLabel("guinea_pig", null) // "Porquinho-da-índia"
 */
export function speciesLabel(species: PetSpecies, description: string | null): string {
  return species === "exotic" ? description || "Outro bicho" : SPECIES[species];
}

/** @example sizeLabel("medium") // "porte médio" */
export function sizeLabel(size: PetSize): string {
  return SIZES[size];
}

/**
 * Idade arredondada para baixo: anos; abaixo de 1 ano, meses; abaixo de 1 mês, "menos de 1 mês".
 * A data é aproximada; sem data (ou no futuro) não há idade.
 * @example ageLabel("2022-06-01", new Date("2026-10-13")) // "4 anos"
 */
export function ageLabel(birthDate: string | null, now: Date): string | null {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split("-").map(Number);
  let months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  if (now.getDate() < day) months -= 1;
  if (months < 0) return null;
  if (months >= 12) {
    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? "ano" : "anos"}`;
  }
  if (months === 0) return "menos de 1 mês";
  return `${months} ${months === 1 ? "mês" : "meses"}`;
}

/**
 * Linha de resumo da carteirinha (REQ-PETS-011), a mesma na lista, na ficha (022), na revisão (021) e na
 * escolha da estadia (050): raça ou espécie · porte · idade · sexo · castração. O que falta não aparece;
 * sexo desconhecido não entra nem flexiona a castração.
 *
 * @example describePet(luna, new Date()) // "Vira-lata · porte médio · 4 anos · fêmea · castrada"
 */
export function describePet(pet: Pet, now: Date): string {
  const parts = [
    pet.breed || speciesLabel(pet.species, pet.speciesDescription),
    pet.size ? sizeLabel(pet.size) : null,
    ageLabel(pet.birthDate, now),
    pet.sex === "male" ? "macho" : pet.sex === "female" ? "fêmea" : null,
    pet.isNeutered ? (pet.sex === "female" ? "castrada" : "castrado") : null,
  ];
  return parts.filter(Boolean).join(" · ");
}
