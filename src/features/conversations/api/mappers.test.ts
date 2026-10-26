import { describe, expect, it } from "vitest";
import { conversationDto, messageDto } from "@/test/fixtures/conversations";
import { conversationDtoSchema, messageDtoSchema, messagePageSchema } from "./contracts";
import { toConversation, toMessage, toMessagePage } from "./mappers";

describe("conversations mappers", () => {
  it("preserves ownerId when the optional owner display object is absent", () => {
    const dto = conversationDto({ owner: null });
    expect(toConversation(conversationDtoSchema.parse(dto))).toMatchObject({ ownerId: dto.ownerId, owner: null });
  });
  it("REQ-CHAT-005 mensagem: campos omitidos pela API viram null", () => {
    const message = toMessage(messageDtoSchema.parse(messageDto({ body: undefined, imageUrl: "/foto.webp" })));
    expect(message).toMatchObject({ body: null, imageUrl: "/foto.webp", bookingId: null, sentBy: "host" });
  });

  it("REQ-CHAT-005 'sentBy' fora de owner/host quebra o contrato", () => {
    expect(() => messageDtoSchema.parse(messageDto({ sentBy: "admin" }))).toThrow();
  });

  it("REQ-CHAT-001 conversa: pessoas só com id, nome e foto; última mensagem convertida", () => {
    const conversation = toConversation(conversationDtoSchema.parse(conversationDto({ lastMessage: undefined })));
    expect(conversation.host).toEqual({
      id: conversation.host?.id,
      name: "Dona Cida",
      avatarUrl: "/brand/turma/golden.webp",
    });
    expect(conversation.lastMessage).toBeNull();
    expect(conversation.unreadCount).toBe(2);
  });

  it("REQ-CHAT-007 página de mensagens mantém a ordem da API e o 'hasMore'", () => {
    const first = messageDto({ createdAt: "2026-12-21T19:03:00Z" });
    const second = messageDto({ createdAt: "2026-12-21T19:02:00Z" });
    const page = toMessagePage(messagePageSchema.parse({ items: [first, second], pageSize: 50, hasMore: true }));
    expect(page.items.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(page.hasMore).toBe(true);
  });
});
