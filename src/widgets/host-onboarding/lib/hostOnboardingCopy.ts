/** Textos do painel "Seu caminho pra receber pets" (spec 030, REQ-HVER-001; etapas 2 e 3 na 044, REQ-LIST-001). */
export const hostOnboardingCopy = {
  heading: "Seu caminho pra receber pets",
  states: { current: "Agora", done: "Pronta", locked: "Travada" },
  stages: {
    verification: {
      title: "Mostrar quem eu sou",
      current: "A gente confere seu documento e uma selfie.",
      done: "Verificação aprovada.",
      action: "Ver minha verificação",
    },
    payout: {
      title: "Como eu recebo",
      locked: "Abre quando sua verificação for aprovada.",
      done: "Recebimento conectado.",
      /** Situação do cadastro de recebimento (`stripeStatus` de `GET /hosts/me`). */
      byStatus: {
        not_started: "Falta conectar o recebimento.",
        in_progress: "O cadastro do recebimento ficou pela metade.",
        under_review: "O Stripe está conferindo o seu cadastro.",
        restricted: "O Stripe pediu mais alguma informação.",
      } as Readonly<Record<string, string>>,
      fallback: "Falta conectar o recebimento.",
      action: "Ver como eu recebo",
    },
    listing: {
      title: "Montar meu cantinho",
      locked: "Abre quando o recebimento estiver conectado.",
      current: "Monte as seções no seu ritmo e abra quando estiver pronto.",
      done: "Seu cantinho está aberto.",
      action: "Montar meu cantinho",
    },
  },
} as const;
