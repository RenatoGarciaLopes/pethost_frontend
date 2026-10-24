/**
 * Fixtures de conversas (spec 055, em rascunho), no formato do OpenAPI (`/conversations`). Dados sintéticos: nomes e
 * mensagens não são de ninguém. A conversa da Dona Cida reproduz a prancha da tela de Conversas.
 */

export const CAMILA_OWNER_ID = "0199f0a0-0000-7000-8000-00000000c0a1";
export const CIDA_HOST_ID = "0199f0a0-0000-7000-8000-00000000c0b1";
export const TERESA_HOST_ID = "0199f0a0-0000-7000-8000-00000000c0b2";
export const ANTONIO_HOST_ID = "0199f0a0-0000-7000-8000-00000000c0b3";

export const CIDA_CONVERSATION_ID = "0199f0a0-0000-7000-8000-00000000c1a1";
export const TERESA_CONVERSATION_ID = "0199f0a0-0000-7000-8000-00000000c1a2";
export const ANTONIO_CONVERSATION_ID = "0199f0a0-0000-7000-8000-00000000c1a3";
export const STAY_BOOKING_ID = "0199f0a0-0000-7000-8000-00000000c2a1";

/** "Agora" das fixtures: 21/12/2026, 16h10 em Brasília (segundo dia da estadia da Pipoca). */
export const CONVERSATIONS_NOW = new Date("2026-12-21T19:10:00Z");

const camila = { id: CAMILA_OWNER_ID, name: "Camila", avatarUrl: null };
const cida = { id: CIDA_HOST_ID, name: "Dona Cida", avatarUrl: "/brand/turma/golden.webp" };

let sequence = 0;
const nextMessageId = () => `0199f0a0-0000-7000-8000-${String(++sequence).padStart(12, "0")}`;

/** Uma mensagem como sai da API. Padrão: texto do anfitrião. */
export function messageDto(overrides: Record<string, unknown> = {}) {
  return {
    id: nextMessageId(),
    conversationId: CIDA_CONVERSATION_ID,
    sentBy: "host",
    body: "Oi, Camila! Pode trazer a Pipoca no sábado.",
    createdAt: "2026-12-21T19:00:00Z",
    ...overrides,
  };
}

/** Uma conversa como o tutor vê. Padrão: com a Dona Cida, duas mensagens não lidas. */
export function conversationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: CIDA_CONVERSATION_ID,
    ownerId: CAMILA_OWNER_ID,
    owner: camila,
    hostId: CIDA_HOST_ID,
    host: cida,
    lastMessage: messageDto({ body: "Hoje tem jogo e vai ter rojão. Já separei a toalha dela no banheiro." }),
    unreadCount: 2,
    blocked: false,
    blockedByMe: false,
    blockedByModeration: false,
    lastMessageAt: "2026-12-21T19:03:00Z",
    createdAt: "2026-12-01T12:00:00Z",
    ...overrides,
  };
}

/** As três conversas da prancha, da atividade mais recente para a mais antiga (como `GET /conversations/me`). */
export function previewConversationDtos() {
  return [
    conversationDto(),
    conversationDto({
      id: TERESA_CONVERSATION_ID,
      hostId: TERESA_HOST_ID,
      host: { id: TERESA_HOST_ID, name: "Teresa", avatarUrl: "/brand/turma/corgi.webp" },
      lastMessage: messageDto({
        conversationId: TERESA_CONVERSATION_ID,
        sentBy: "owner",
        body: "Obrigada por tudo!",
        createdAt: "2026-10-08T21:40:00Z",
      }),
      unreadCount: 0,
      lastMessageAt: "2026-10-08T21:40:00Z",
    }),
    conversationDto({
      id: ANTONIO_CONVERSATION_ID,
      hostId: ANTONIO_HOST_ID,
      host: { id: ANTONIO_HOST_ID, name: "Seu Antônio e Marli", avatarUrl: "/brand/turma/pastor.webp" },
      lastMessage: messageDto({
        conversationId: ANTONIO_CONVERSATION_ID,
        sentBy: "owner",
        body: "Tem vaga no feriado?",
        createdAt: "2026-10-02T14:15:00Z",
      }),
      unreadCount: 0,
      lastMessageAt: "2026-10-02T14:15:00Z",
    }),
  ];
}

/** As mensagens da conversa com a Dona Cida, da mais nova para a mais antiga (como `GET .../messages`). */
export function previewMessageDtos() {
  const during = { bookingId: STAY_BOOKING_ID };
  return [
    messageDto({
      ...during,
      body: "Hoje tem jogo e vai ter rojão. Já separei a toalha dela no banheiro.",
      createdAt: "2026-12-21T19:03:00Z",
    }),
    messageDto({
      ...during,
      body: "Brincou a tarde toda com o Bóris. Já jantou!",
      imageUrl: "/brand/turma/golden.webp",
      createdAt: "2026-12-21T19:02:00Z",
    }),
    messageDto({
      ...during,
      sentBy: "owner",
      body: "Que alívio! Obrigada, Dona Cida.",
      createdAt: "2026-12-20T17:31:00Z",
    }),
    messageDto({
      ...during,
      body: "A Pipoca chegou! Já cheirou o quintal inteiro.",
      createdAt: "2026-12-20T17:20:00Z",
    }),
  ];
}

/** A estadia da Pipoca na casa da Dona Cida (o contexto que o painel mostra). Chegou ontem às 14h18. */
export const previewStay = {
  status: "in_progress",
  checkIn: "2026-12-20",
  checkOut: "2026-12-25",
  petNames: ["Pipoca"],
  hostName: "Dona Cida",
  listingTitle: "Casa da Dona Cida",
  neighborhood: "Jd. Alvorada",
  checkedInAt: "2026-12-20T17:18:00Z",
} as const;
