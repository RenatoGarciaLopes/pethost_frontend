import { NextRequest } from "next/server";
import { afterEach, expect, it, vi } from "vitest";
import { parseServerEnv } from "@/shared/config/env.server";
import { ApiError } from "@/shared/api/errors/ApiError";
import { sessionFixture, sessionUserFixture } from "@/test/fixtures/session";
import { conversationStream } from "./conversationStream";

class Socket extends EventTarget {
  readyState = 1;
  send = vi.fn();
  close = vi.fn();
  frame(data: string) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}
const env = parseServerEnv({ BACKEND_URL: "https://api.test", BACKEND_API_PREFIX: "/api/v1" });
const subscriptions: AbortController[] = [];
afterEach(() => {
  subscriptions.splice(0).forEach((abort) => abort.abort());
  vi.useRealTimers();
});
function setup(role = "owner", accountId: string = sessionUserFixture.id) {
  const abort = new AbortController();
  subscriptions.push(abort);
  const request = new NextRequest(`http://localhost:3000/api/conversations/realtime?accountId=${accountId}`, {
    signal: abort.signal,
    headers: { cookie: "pethost_at=test-token; pethost_rt=test-refresh" },
  });
  const socket = new Socket();
  const factory = vi.fn<(url: URL) => WebSocket>(() => socket as unknown as WebSocket);
  const gateway = {
    resolveAccess: vi.fn().mockResolvedValue({ status: "valid", accessToken: "server-secret" }),
    forceRefresh: vi.fn(),
  };
  const userClient = { request: vi.fn().mockResolvedValue({ ...sessionUserFixture, role }) };
  return { request, socket, factory, gateway, userClient, abort, deps: { env, socket: factory, gateway, userClient } };
}

it("confirma conta e faz handshake no hub mantendo JWT fora do SSE; suporta frames fragmentados", async () => {
  const { request, socket, factory, deps, abort } = setup();
  const response = await conversationStream(request, deps);
  expect(response.headers.get("content-type")).toContain("text/event-stream");
  const address = factory.mock.calls[0]?.[0] as unknown as URL;
  expect(address.protocol).toBe("wss:");
  expect(address.pathname).toBe("/hubs/conversations");
  expect(address.searchParams.get("access_token")).toBe("server-secret");
  const reader = response.body!.getReader();
  const decode = (data: Uint8Array | undefined) => new TextDecoder().decode(data);
  expect(decode((await reader.read()).value)).toContain(": connecting");
  socket.dispatchEvent(new Event("open"));
  expect(socket.send).toHaveBeenCalledWith('{"protocol":"json","version":1}\u001e');
  socket.frame("{");
  socket.frame("}\u001e");
  expect(decode((await reader.read()).value)).toContain("event: ready");
  socket.frame('{"type":1,"target":"unreadCountChanged","arguments":[{"total":2}]}\u001e');
  const received = decode((await reader.read()).value);
  expect(received).toContain('data: {"total":2}');
  expect(received).not.toContain("server-secret");
  abort.abort();
  expect(socket.close).toHaveBeenCalledTimes(1);
  expect((await reader.read()).done).toBe(true);
});

it.each(["host", "owner"])("permite %s; cancela socket e timers quando o leitor encerra", async (role) => {
  const { request, deps, socket } = setup(role);
  const response = await conversationStream(request, deps);
  await response.body!.cancel();
  expect(socket.close).toHaveBeenCalledTimes(1);
});

it.each(["admin", "different-account"])("não abre hub para %s", async (scenario) => {
  const { request, deps, factory } = setup(
    scenario === "admin" ? "admin" : "owner",
    scenario === "admin" ? sessionUserFixture.id : "other",
  );
  expect((await conversationStream(request, deps)).status).toBe(403);
  expect(factory).not.toHaveBeenCalled();
});

it("não abre hub para conta inativa confirmada pela API", async () => {
  const { request, deps, userClient, factory } = setup();
  userClient.request.mockResolvedValue({ ...sessionUserFixture, isActive: false });
  expect((await conversationStream(request, deps)).status).toBe(403);
  expect(factory).not.toHaveBeenCalled();
});

it("renova uma vez após 401 e aplica novos cookies HttpOnly", async () => {
  const { request, deps, userClient, gateway } = setup();
  userClient.request.mockRejectedValueOnce(new ApiError({ status: 401, code: "TOKEN_EXPIRED", message: "expired" }));
  const session = sessionFixture();
  gateway.forceRefresh.mockResolvedValue({ status: "renewed", accessToken: session.accessToken, session });
  const response = await conversationStream(request, deps);
  expect(gateway.forceRefresh).toHaveBeenCalledTimes(1);
  expect(response.headers.getSetCookie().join(";")).toContain("HttpOnly");
  await response.body!.cancel();
});

it("rejeita origem externa e sessão ausente sem abrir socket", async () => {
  const { deps, factory } = setup();
  const crossSite = new NextRequest(
    `http://localhost:3000/api/conversations/realtime?accountId=${sessionUserFixture.id}`,
    { headers: { origin: "https://foreign.test" } },
  );
  expect((await conversationStream(crossSite, deps)).status).toBe(403);
  deps.gateway.resolveAccess.mockResolvedValue({ status: "anonymous" });
  const local = new NextRequest(`http://localhost:3000/api/conversations/realtime?accountId=${sessionUserFixture.id}`);
  expect((await conversationStream(local, deps)).status).toBe(401);
  expect(factory).not.toHaveBeenCalled();
});

it("fecha em erro de handshake, overflow ou silêncio do hub", async () => {
  vi.useFakeTimers();
  const { request, deps, socket } = setup();
  const response = await conversationStream(request, deps);
  socket.frame('{"error":"not allowed"}\u001e');
  expect(socket.close).toHaveBeenCalledTimes(1);
  await response.body!.cancel();
  const second = setup();
  const next = await conversationStream(second.request, second.deps);
  second.socket.frame("{}\u001e");
  await vi.advanceTimersByTimeAsync(60_000);
  expect(second.socket.close).toHaveBeenCalledTimes(1);
  await next.body!.cancel();
  const third = setup();
  const oversized = await conversationStream(third.request, third.deps);
  third.socket.frame("x".repeat(262_145));
  expect(third.socket.close).toHaveBeenCalledTimes(1);
  await oversized.body!.cancel();
});
