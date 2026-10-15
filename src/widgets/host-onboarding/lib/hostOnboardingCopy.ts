/** Textos do painel "Seu caminho pra receber pets" (spec 030, REQ-HVER-001). */
export const hostOnboardingCopy = {
  heading: "Seu caminho pra receber pets",
  states: { current: "Agora", done: "Pronta", unlocked: "Liberada", locked: "Travada" },
  stages: {
    verification: {
      title: "Mostrar quem eu sou",
      current: "A gente confere seu documento e uma selfie.",
      done: "Verificação aprovada.",
    },
    payout: {
      title: "Como eu recebo",
      locked: "Abre quando sua verificação for aprovada.",
      unlocked: "Liberada: o cadastro do recebimento chega em breve por aqui.",
    },
    listing: {
      title: "Montar meu cantinho",
      locked: "Abre quando o recebimento estiver conectado.",
    },
  },
} as const;
