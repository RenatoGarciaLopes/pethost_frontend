/** Textos de "Meus pets" (spec 020, seção Microcopy). Erros da API vêm de `getErrorMessage`. */
export const petsCopy = {
  pageTitle: "Meus pets · PetHost",
  title: "Meus pets",
  card: (name: string) => `Ficha de ${name}`,
  newPet: "Apresentar outro pet",
  empty: { title: "Apresenta seu pet pra gente? Leva uns 3 minutos.", action: "Apresentar meu pet" },
  inactive: {
    title: (count: number) => `Fora da lista (${count})`,
    help: "As fichas continuam aqui. As estadias antigas também.",
  },
  loadError: "Não deu pra ver seus pets agora.",
  loading: "Buscando seus pets",
} as const;
