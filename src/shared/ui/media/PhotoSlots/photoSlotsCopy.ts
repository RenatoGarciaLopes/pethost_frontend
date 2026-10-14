/** Textos das vagas de foto (spec 021, REQ-PNEW-007). */
export const photoSlotsCopy = {
  add: (slot: number) => `Adicionar foto ${slot}`,
  remove: (slot: number) => `Tirar foto ${slot}`,
  preview: (slot: number) => `Prévia da foto ${slot}`,
  cover: "capa",
  invalid: "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.",
  uploading: "Enviando…",
} as const;
