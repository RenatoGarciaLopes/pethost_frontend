import type { z } from "zod";
import { PatchApiV1PetsPetIdBody } from "@/shared/api/generated/pets/pets.zod";
import { diffPatch } from "@/shared/lib/patch/diffPatch";
import type { PetProfileValues } from "../schemas/petProfileSchema";
import { normalizeMicrochip } from "../lib/normalizeMicrochip";
import { allowsSize, requiresDescription, requiresSize } from "../lib/species";

const clearable: readonly (keyof PetProfileValues)[] = [
  "breed",
  "birthDate",
  "medicationNotes",
  "feedingNotes",
  "vetContact",
  "notes",
  "microchip",
  "allergies",
];
const normalized = (values: PetProfileValues): PetProfileValues => ({
  ...values,
  microchip: values.microchip?.trim() ? (normalizeMicrochip(values.microchip) ?? values.microchip) : undefined,
});

/**
 * Corpo mínimo validado do PATCH /pets/{petId} (REQ-PEDIT-005 a 007).
 * Recebe fichas já validadas pelo petProfileSchema; não substitui validação da ficha inteira.
 * Peso apagado não vai (não é `clearable`) e campos incompatíveis são limpos pela API ao trocar espécie.
 * @example const body = toUpdatePetRequest(original, edited); // {} quando nada mudou
 */
export function toUpdatePetRequest(
  original: PetProfileValues,
  edited: PetProfileValues,
): z.output<typeof PatchApiV1PetsPetIdBody> {
  const patch = diffPatch(normalized(original), normalized(edited), { clearable });
  if (!allowsSize(edited.species)) delete patch.size;
  if (!requiresDescription(edited.species)) delete patch.speciesDescription;
  if (original.species !== edited.species) {
    if (requiresSize(edited.species)) patch.size = edited.size;
    if (requiresDescription(edited.species)) patch.speciesDescription = edited.speciesDescription;
  }
  return PatchApiV1PetsPetIdBody.parse(patch);
}
