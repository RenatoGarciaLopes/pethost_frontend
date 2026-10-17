/**
 * Textos visíveis do Início, alinhados ao tom de vizinhança aprovado no design.
 * @example homeCopy.genericTitle // "Um quintal pro seu pet enquanto você viaja."
 */
export const homeCopy = {
  pageTitle: "Início · PetHost",
  genericTitle: "Um quintal pro seu pet enquanto você viaja.",
  petsTitle: (names: readonly string[]) =>
    names.length === 1
      ? `Um quintal pra ${names[0]} enquanto você viaja.`
      : "Um quintal pros seus pets enquanto você viaja.",
  support: "Vizinhos de Maringá que recebem cães e gatos na própria casa.",
  supportWithPets: "Vizinhos de Maringá que recebem pets na própria casa.",
  location: "Onde",
  locationPlaceholder: "Perto de casa ou cidade",
  checkIn: "Chegada",
  checkOut: "Saída",
  pet: "Pet",
  speciesPrompt: "Cão ou gato?",
  species: { dog: "Cão", cat: "Gato" },
  count: (amount: number) => `${amount} ${amount === 1 ? "pet" : "pets"}`,
  guestHint: "Entre para ver os cantinhos disponíveis.",
  ownerEmptyHint: "Você pode buscar antes de cadastrar seu pet.",
  ownerPetsHint: "Escolha quem vai viajar com você.",
  hostHint: "Quantos pets viajam com você?",
  petError: "Não conseguimos carregar seus pets agora. Você pode buscar por cão ou gato.",
  search: "Achar um cantinho",
  searchMobile: "Buscar cantinhos",
  openSearch: "Abrir busca",
  closeSearch: "Fechar busca",
  trust: ["Converse antes de combinar", "Receba foto todo dia", "Pagamento protegido até seu pet voltar"],
  loading: "Preparando seu quintal",
  signIn: "Entrar",
  signUp: "Criar conta",
  account: "Minha conta",
} as const;
