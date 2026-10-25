import { bffClient } from "@/shared/api/client/bffClient";
import { withSessionRetry } from "@/shared/api/client/withSessionRetry";
import { PostApiV1ConversationsBody } from "@/shared/api/generated/conversations/conversations.zod";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { conversationDtoSchema, readMarkerSchema, sentMessageSchema, sentPhotoMessageSchema } from "../contracts";

const conversationPath = (conversationId: string) => `/conversations/${encodeURIComponent(conversationId)}`;

/**
 * Cria ou recupera a conversa única do tutor com o anfitrião do cantinho (POST /conversations).
 * O backend garante a mesma conversa para a dupla tutor–anfitrião.
 * @example await startConversation(listingId);
 */
export function startConversation(listingId: string, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: "/conversations", body: PostApiV1ConversationsBody.parse({ listingId }) },
    conversationDtoSchema,
  );
}

/**
 * Envia texto (REQ-CHAT-008). O lado de quem envia sai do papel da sessão; sem nova tentativa automática, para a
 * mensagem não sair duas vezes.
 * @example await sendMessage(conversation.id, "Oi, Dona Cida!");
 */
export function sendMessage(conversationId: string, body: string, transport: HttpTransport = bffClient) {
  return transport.request(
    { method: "POST", path: `${conversationPath(conversationId)}/messages`, body: { body } },
    sentMessageSchema,
  );
}

/**
 * Envia uma foto com legenda opcional (REQ-CHAT-009): `file` e `body` em multipart. Renova a sessão uma vez se
 * precisar (o corpo é refeito em memória).
 * @example await sendPhotoMessage(conversation.id, file, "Olha ela!");
 */
export function sendPhotoMessage(
  conversationId: string,
  file: File,
  caption: string,
  transport: HttpTransport = bffClient,
) {
  return withSessionRetry(() => {
    const body = new FormData();
    body.append("file", file);
    if (caption) body.append("body", caption);
    return transport.request(
      { method: "POST", path: `${conversationPath(conversationId)}/messages/photo`, body },
      sentPhotoMessageSchema,
    );
  }, transport);
}

/**
 * Marca como lidas as mensagens recebidas na conversa e devolve o contador novo da conta. Idempotente.
 * @example const total = await markConversationRead(conversation.id);
 */
export async function markConversationRead(conversationId: string, transport: HttpTransport = bffClient) {
  const { total } = await transport.request(
    { method: "PUT", path: `${conversationPath(conversationId)}/read-marker` },
    readMarkerSchema,
  );
  return total;
}
