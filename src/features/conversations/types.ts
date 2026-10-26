/** Os dois lados de uma conversa, como a API diz em `sentBy`. */
export type ConversationSide = "owner" | "host";

/** Nome e foto de um lado (tutor ou anfitrião). Empresa vem pelo nome fantasia. */
export interface ConversationParty {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/** Uma mensagem: texto, foto com legenda opcional ou só foto. `createdAt` é um instante ISO. */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  sentBy: ConversationSide;
  /** Texto ou legenda da foto; `null` em foto sem legenda. */
  body: string | null;
  /** Foto no bucket público; `null` em mensagem só de texto. */
  imageUrl: string | null;
  /** Estadia em andamento quando a mensagem saiu (histórico da reserva). */
  bookingId: string | null;
  createdAt: string;
}

/** Uma conversa vista por um dos lados (o papel da sessão decide qual). */
export interface Conversation {
  id: string;
  ownerId: string;
  owner: ConversationParty | null;
  host: ConversationParty | null;
  lastMessage: ConversationMessage | null;
  /** Mensagens que quem vê recebeu e ainda não leu. */
  unreadCount: number;
  /** Bloqueada por um dos lados ou pela moderação: ninguém envia, os dois leem. */
  blocked: boolean;
  blockedByMe: boolean;
  blockedByModeration: boolean;
  lastMessageAt: string | null;
  createdAt: string;
}

/** Uma página de mensagens, da mais nova para a mais antiga; `hasMore` diz se há anteriores. */
export interface MessagePage {
  items: ConversationMessage[];
  hasMore: boolean;
}

/** O que sai do campo de mensagem: o texto (ou a legenda) e, se houver, a foto escolhida. */
export interface ComposedMessage {
  body: string;
  photo: File | null;
}
