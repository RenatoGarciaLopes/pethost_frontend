/** Textos das vagas de foto (spec 021, REQ-PNEW-007; troca e foto salva na 022, REQ-PEDIT-008). */
export const photoSlotsCopy = {
  add: (slot: number) => `Adicionar foto ${slot}`,
  replace: (slot: number) => `Trocar foto ${slot}`,
  remove: (slot: number) => `Tirar foto ${slot}`,
  preview: (slot: number) => `Prévia da foto ${slot}`,
  saved: (slot: number) => `Foto ${slot}`,
  cover: "capa",
  makeCover: "Usar como capa",
  makeCoverOf: (slot: number) => `: foto ${slot}`,
  moveUp: (slot: number) => `Mover a foto ${slot} para cima`,
  moveDown: (slot: number) => `Mover a foto ${slot} para baixo`,
  invalid: "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.",
  uploading: "Enviando…",
} as const;
