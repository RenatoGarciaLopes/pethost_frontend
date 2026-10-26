import type { PetDetail } from "../types";
import { coexistenceSummary } from "./coexistenceSummary";
import { ageLabel, sizeLabel, speciesLabel } from "./describePet";
import { petEditCopy } from "./petEditCopy";
import { petWizardCopy } from "./petWizardCopy";
import { usesGrams } from "./species";

/** As seções da edição na ordem da trilha (107), com o `id` que vai na URL (`?secao=saude`). */
export const PET_EDIT_SECTION_IDS = ["fotos", "bicho", "nome", "corpo", "saude", "rotina", "convivencia"] as const;
export type PetEditSectionId = (typeof PET_EDIT_SECTION_IDS)[number];

/** Nome da busca que guarda a seção aberta. */
export const SECTION_PARAM = "secao";

/**
 * Posição da seção pedida na URL; sem seção ou com uma que não existe, a primeira (Fotos).
 * @example sectionIndexOf("saude") // 4
 */
export function sectionIndexOf(id: string | null): number {
  return Math.max(0, PET_EDIT_SECTION_IDS.indexOf(id as PetEditSectionId));
}

const copy = petEditCopy.summary;
const join = (parts: readonly (string | false | null | undefined)[]) => parts.filter(Boolean).join(" · ");
const flex = (word: string, sex: PetDetail["values"]["sex"]) => (sex === "female" ? `${word}a` : `${word}o`);

/** "4,2 kg"; nos bichos pequenos, em gramas ("35 g"), como no formulário do corpo. */
function weightText({ species, weightKg }: PetDetail["values"]): string | null {
  if (weightKg === undefined) return null;
  return usesGrams(species) ? `${Math.round(weightKg * 1000)} g` : `${String(weightKg).replace(".", ",")} kg`;
}

/**
 * Resumo curto do que está salvo em cada seção, para a linha de apoio da trilha (107): nada de "feito", porque toda
 * seção já existe. Sem resposta, "Nada contado ainda.".
 *
 * @example petSectionSummary("corpo", thor, now) // "4,2 kg · 5 anos"
 */
export function petSectionSummary(id: PetEditSectionId, pet: PetDetail, now: Date): string {
  const values = pet.values;
  const summary = {
    fotos: () => copy.photos(pet.photos.length),
    bicho: () =>
      join([speciesLabel(values.species, values.speciesDescription ?? null), values.size && sizeLabel(values.size)]),
    nome: () => join([values.name, values.sex === "male" ? "macho" : values.sex === "female" ? "fêmea" : null]),
    corpo: () => join([weightText(values), ageLabel(values.birthDate ?? null, now)]) || values.breed,
    saude: () =>
      join([
        values.isVaccinated !== undefined && (values.isVaccinated ? copy.vaccinated : copy.notVaccinated),
        values.isNeutered !== undefined && `${values.isNeutered ? "" : "não "}${flex("castrad", values.sex)}`,
      ]),
    rotina: () => values.feedingNotes || values.notes,
    convivencia: () => {
      const answers = [values.goodWithDogs, values.goodWithCats, values.goodWithKids];
      if (answers.every((answer) => answer === undefined)) return null;
      return (
        coexistenceSummary({
          goodWithDogs: values.goodWithDogs ?? false,
          goodWithCats: values.goodWithCats ?? false,
          goodWithKids: values.goodWithKids ?? false,
        }) || copy.noCompany
      );
    },
  }[id]();
  // "castrado" sozinho (sem a vacina respondida) também começa em maiúscula.
  return summary ? summary.charAt(0).toUpperCase() + summary.slice(1) : petWizardCopy.review.emptyBlock;
}
