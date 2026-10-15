/** Textos da vaga de foto de documento (spec 030, REQ-HVER-006/018). Genéricos: o nome da vaga vem de quem usa. */
export const documentSlotCopy = {
  take: "Tirar foto",
  retake: "Tirar de novo",
  gallery: "Escolher da galeria",
  uploaded: "Enviada ✓",
  preparing: "Preparando a foto…",
  cameraInput: (label: string) => `${label}: câmera`,
  galleryInput: (label: string) => `${label}: galeria`,
} as const;
