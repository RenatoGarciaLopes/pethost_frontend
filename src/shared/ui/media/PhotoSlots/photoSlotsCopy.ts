/** Textos das vagas de foto (spec 021, REQ-PNEW-007; troca e foto salva na 022, REQ-PEDIT-008). */
export const photoSlotsCopy = {
  add: (slot: number) => `Adicionar foto ${slot}`,
  replace: (slot: number) => `Trocar foto ${slot}`,
  remove: (slot: number) => `Tirar foto ${slot}`,
  preview: (slot: number) => `Prévia da foto ${slot}`,
  saved: (slot: number) => `Foto ${slot}`,
  cover: "capa",
  makeCover: "Usar como capa",
  replaceShort: "Trocar",
  removeShort: "Tirar",
  options: (slot: number) => `Opções da foto ${slot}`,
  drag: (slot: number) => `Arrastar foto ${slot}`,
  moveBefore: "Mover para antes",
  moveAfter: "Mover para depois",
  instructions:
    "Para pegar a foto, pressione espaço. Use as setas para mover, espaço para soltar e Escape para cancelar.",
  announcements: (total: number) => ({
    onDragStart: ({ active }: { active: { id: string | number } }) =>
      `Foto ${Number(active.id) + 1} pega. Posição ${Number(active.id) + 1} de ${total}.`,
    onDragOver: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over ? `Foto ${Number(active.id) + 1} na posição ${Number(over.id) + 1} de ${total}.` : undefined,
    onDragEnd: ({ active, over }: { active: { id: string | number }; over: { id: string | number } | null }) =>
      over
        ? `Foto ${Number(active.id) + 1} solta na posição ${Number(over.id) + 1}${Number(over.id) === 0 ? ", agora é a capa" : ""}.`
        : "Foto solta sem mudar de posição.",
    onDragCancel: () => "Arraste cancelado. A ordem das fotos não mudou.",
  }),
  invalid: "Essa foto não serve: use JPG, PNG ou WebP de até 5 MB.",
  uploading: "Enviando…",
} as const;
