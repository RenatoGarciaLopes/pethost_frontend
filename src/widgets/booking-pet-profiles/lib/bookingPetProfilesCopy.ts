/** Textos da ficha dos pets no pedido (spec 053, REQ-HREQ-003). */
export const bookingPetProfilesCopy = {
  heading: "Quem vem",
  thisPet: "esse pet",
  failed: (name: string) => `Não deu pra abrir a ficha de ${name} agora.`,
  retry: "Tentar de novo",
} as const;
