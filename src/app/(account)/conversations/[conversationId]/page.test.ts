import { expect, it, vi } from "vitest";
import { metadata } from "./page";

vi.mock("@/widgets/conversation-panel/index.server", () => ({ ConversationsScreen: () => null }));
vi.mock("@/shared/auth/server/requirePersonalUser", () => ({ requirePersonalUser: vi.fn() }));

it("REQ-CHAT-002 título próprio e fora dos buscadores", () => {
  expect(metadata).toEqual({ title: "Conversas · PetHost", robots: { index: false, follow: false } });
});
