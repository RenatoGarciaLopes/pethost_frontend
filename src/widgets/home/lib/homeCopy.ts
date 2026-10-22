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
  supportSecond: "Você conversa antes, paga pelo app e recebe foto todo dia.",
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
  openSearch: "Onde, datas e pet",
  closeSearch: "Fechar busca",
  trust: [
    { title: "Conversa antes de fechar", description: "Pergunte tudo sobre a casa e a rotina.", icon: "chat" },
    { title: "Foto do seu pet todo dia", description: "As notícias chegam pelo chat.", icon: "camera" },
    {
      title: "Pagamento guardado",
      description: "O anfitrião só recebe depois que seu pet volta pra casa.",
      icon: "lock",
    },
  ],
  loading: "Preparando seu quintal",
  nearby: {
    askTitle: "Casas com vaga perto de você",
    askBody:
      "Deixe o navegador dizer onde você está e a gente procura cantinhos por perto. Sua posição não fica guardada.",
    useLocation: "Usar minha localização",
    asking: "Esperando o navegador",
    finding: "Farejando cantinhos",
    title: (total: number) => `${total} ${total === 1 ? "casa com vaga" : "casas com vaga"} perto de você`,
    seeAll: "Ver todos os cantinhos",
    denied: "Sem a localização não dá para olhar por perto. Escreva a cidade ou o bairro na busca, no topo da página.",
    unavailable: "Este navegador não informa a localização. Escreva a cidade ou o bairro na busca, no topo da página.",
    failed: "Não conseguimos saber onde você está agora.",
    retry: "Tentar de novo",
    signIn: "Entre para ver os cantinhos disponíveis.",
    signInAction: "Entrar",
    empty: "Ainda não achamos cantinhos num raio de 10 km. Tente outra cidade na busca.",
    error: "Não conseguimos carregar os cantinhos agora.",
  },
} as const;
