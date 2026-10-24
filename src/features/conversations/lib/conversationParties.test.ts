import { describe, expect, it } from "vitest";
import { conversationDto, messageDto } from "@/test/fixtures/conversations";
import { conversationDtoSchema } from "../api/contracts";
import { toConversation } from "../api/mappers";
import { blockedNotice, lastMessagePreview, otherPartyName } from "./conversationParties";
import { conversationsCopy } from "./conversationsCopy";

const conversation = (overrides: Record<string, unknown> = {}) =>
  toConversation(conversationDtoSchema.parse(conversationDto(overrides)));

describe("conversationParties", () => {
  it("REQ-CHAT-001 o tutor vê o anfitrião e o anfitrião vê o tutor; conta que sumiu vira 'Conta removida'", () => {
    expect(otherPartyName(conversation(), "owner")).toBe("Dona Cida");
    expect(otherPartyName(conversation(), "host")).toBe("Camila");
    expect(otherPartyName(conversation({ host: null }), "owner")).toBe(conversationsCopy.goneParty);
  });

  it("REQ-CHAT-001 prévia da última mensagem: texto, 'Você:' quando foi quem vê e 'Foto' sem legenda", () => {
    const last = (overrides: Record<string, unknown>) =>
      conversation({ lastMessage: messageDto(overrides) }).lastMessage;

    expect(lastMessagePreview(last({ sentBy: "host", body: "Já jantou!" }), "owner")).toBe("Já jantou!");
    expect(lastMessagePreview(last({ sentBy: "owner", body: "Obrigada por tudo!" }), "owner")).toBe(
      "Você: Obrigada por tudo!",
    );
    expect(lastMessagePreview(last({ body: undefined, imageUrl: "/foto.webp" }), "owner")).toBe("Foto");
    expect(lastMessagePreview(null, "owner")).toBe(conversationsCopy.noMessages);
  });

  it("REQ-CHAT-010 aviso de bloqueio: moderação primeiro, depois quem bloqueou, e nada quando dá pra escrever", () => {
    expect(blockedNotice(conversation())).toBeNull();
    expect(blockedNotice(conversation({ blocked: true, blockedByMe: true }))).toBe(conversationsCopy.blocked.byMe);
    expect(blockedNotice(conversation({ blocked: true }))).toBe(conversationsCopy.blocked.byOther);
    expect(blockedNotice(conversation({ blocked: true, blockedByMe: true, blockedByModeration: true }))).toBe(
      conversationsCopy.blocked.byModeration,
    );
  });
});
