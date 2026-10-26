import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { messageDto, CIDA_CONVERSATION_ID } from "@/test/fixtures/conversations";
import { notifySessionExpired } from "@/shared/auth/client/sessionEvents";
import { conversationQueries } from "../queries";
import { subscribeConversationRealtime } from "./conversationRealtime";
import { ApiError } from "@/shared/api/errors/ApiError";

const { requestSession } = vi.hoisted(() => ({ requestSession: vi.fn() }));
vi.mock("@/shared/api/client/bffClient", () => ({ bffClient: { request: requestSession } }));

class Stream extends EventTarget {
  static instances: Stream[] = [];
  onerror: (() => void) | null = null;
  close = vi.fn();
  constructor(readonly url: string) {
    super();
    Stream.instances.push(this);
  }
  emit(name: string, data: unknown = {}) {
    this.dispatchEvent(new MessageEvent(name, { data: JSON.stringify(data) }));
  }
}
const releases: (() => void)[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  Stream.instances = [];
  vi.stubGlobal("EventSource", Stream);
  requestSession.mockReset().mockResolvedValue({});
});
afterEach(async () => {
  releases.splice(0).forEach((release) => release());
  await Promise.resolve();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("compartilha a conexão, espera handshake, atualiza eventos sem duplicar e reconcilia ao reconectar", async () => {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, "invalidateQueries");
  const key = conversationQueries.messages("a", CIDA_CONVERSATION_ID).queryKey;
  client.setQueryData(key, { pages: [{ items: [], hasMore: false }], pageParams: [null] });
  releases.push(subscribeConversationRealtime(client, "a"), subscribeConversationRealtime(client, "a"));
  expect(Stream.instances).toHaveLength(1);
  expect(client.getQueryData(conversationQueries.realtime("a"))).not.toBe(true);
  const stream = Stream.instances[0];
  stream.emit("ready");
  expect(client.getQueryData(conversationQueries.realtime("a"))).toBe(true);
  const message = messageDto();
  stream.emit("messageCreated", message);
  stream.emit("messageCreated", message);
  expect(client.getQueryData<{ pages: { items: unknown[] }[] }>(key)?.pages[0].items).toHaveLength(1);
  stream.emit("unreadCountChanged", { total: 3 });
  expect(client.getQueryData(conversationQueries.unreadCount("a").queryKey)).toBe(3);
  stream.emit("conversationBlockChanged", { conversationId: CIDA_CONVERSATION_ID, blocked: true });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: conversationQueries.detail("a", CIDA_CONVERSATION_ID).queryKey });
  stream.onerror?.();
  expect(client.getQueryData(conversationQueries.realtime("a"))).toBe(false);
  await vi.advanceTimersByTimeAsync(1000);
  expect(Stream.instances).toHaveLength(2);
  Stream.instances[1].emit("ready");
  expect(client.getQueryData(conversationQueries.realtime("a"))).toBe(true);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: conversationQueries.all("a") });
});

it("isola troca de conta, encerra sessão e rejeita payload inválido ativando fallback", async () => {
  const client = new QueryClient();
  releases.push(subscribeConversationRealtime(client, "a"));
  const old = Stream.instances[0];
  releases.push(subscribeConversationRealtime(client, "b"));
  expect(old.close).toHaveBeenCalled();
  old.emit("unreadCountChanged", { total: 99 });
  expect(client.getQueryData(conversationQueries.unreadCount("b").queryKey)).toBeUndefined();
  const current = Stream.instances[1];
  current.emit("ready");
  current.emit("unreadCountChanged", { total: -1 });
  expect(client.getQueryData(conversationQueries.realtime("b"))).toBe(false);
  notifySessionExpired();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(Stream.instances).toHaveLength(2);
});

it("encerra imediatamente no clear de logout e ignora eventos atrasados sem recriar cache", () => {
  const client = new QueryClient();
  releases.push(subscribeConversationRealtime(client, "a"));
  const stream = Stream.instances[0];
  stream.emit("ready");
  client.clear();
  expect(stream.close).toHaveBeenCalledTimes(1);
  stream.emit("unreadCountChanged", { total: 99 });
  expect(client.getQueryCache().getAll()).toHaveLength(0);
});

it("encerra reconexão quando o stream perdeu os cookies e a confirmação REST responde 401", async () => {
  const client = new QueryClient();
  releases.push(subscribeConversationRealtime(client, "a"));
  requestSession.mockRejectedValueOnce(new ApiError({ status: 401, code: "UNAUTHORIZED", message: "unauthorized" }));
  Stream.instances[0].emit("ready");
  Stream.instances[0].onerror?.();
  await vi.advanceTimersByTimeAsync(60_000);
  expect(Stream.instances).toHaveLength(1);
  expect(client.getQueryData(conversationQueries.realtime("a"))).toBe(false);
});
