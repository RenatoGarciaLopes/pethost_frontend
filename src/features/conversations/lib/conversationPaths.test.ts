import { describe, expect, it } from "vitest";
import { CIDA_CONVERSATION_ID } from "@/test/fixtures/conversations";
import { conversationPath, isConversationId } from "./conversationPaths";

describe("conversationPaths", () => {
  it("REQ-CHAT-002 endereço de cada conversa", () => {
    expect(conversationPath(CIDA_CONVERSATION_ID)).toBe(`/conversations/${CIDA_CONVERSATION_ID}`);
  });

  it("REQ-CHAT-002 só UUID é id de conversa", () => {
    expect(isConversationId(CIDA_CONVERSATION_ID)).toBe(true);
    expect(isConversationId("conversa-1")).toBe(false);
  });
});
