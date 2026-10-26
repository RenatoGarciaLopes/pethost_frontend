import type { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { notifySessionExpired, onSessionExpired } from "@/shared/auth/client/sessionEvents";
import { isApiError } from "@/shared/api/errors/ApiError";
import { sessionUserSchema } from "@/shared/auth/contracts/session";
import { bffClient } from "@/shared/api/client/bffClient";
import { conversationQueries } from "../queries";
import { messageDtoSchema } from "../contracts";
import { toMessage } from "../mappers";
import { withNewMessage } from "../../lib/withNewMessage";

const unreadSchema = z.object({ total: z.number().int().nonnegative() });
const blockedSchema = z.object({ conversationId: z.string().uuid(), blocked: z.boolean() });
const connections = new WeakMap<QueryClient, { accountId: string; users: number; stop: () => void }>();

/** Uma assinatura por QueryClient/conta/aba, compartilhada por cascas durante navegação e StrictMode. */
export function subscribeConversationRealtime(client: QueryClient, accountId: string) {
  const existing = connections.get(client);
  if (existing && existing.accountId !== accountId) {
    existing.stop();
    connections.delete(client);
  }
  let entry = connections.get(client);
  if (!entry) {
    const statusKey = conversationQueries.realtime(accountId);
    client.setQueryDefaults(statusKey, { gcTime: Infinity });
    client.setQueryData(statusKey, false);
    const statusQuery = client.getQueryCache().find({ queryKey: statusKey, exact: true });
    statusQuery?.setOptions({ ...statusQuery.options, gcTime: Infinity });
    entry = { accountId, users: 0, stop: connect(client, accountId) };
    connections.set(client, entry);
  }
  entry.users++;
  const current = entry;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    current.users--;
    queueMicrotask(() => {
      if (current.users === 0 && connections.get(client) === current) {
        current.stop();
        connections.delete(client);
      }
    });
  };
}

function connect(client: QueryClient, accountId: string) {
  let stopped = false;
  let source: EventSource | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let lastHeartbeat = Date.now();
  let connected = false;
  let attempts = 0;
  let cacheCleared = false;
  const setConnected = (next: boolean, reconcile = true) => {
    if (connected === next) return;
    connected = next;
    client.setQueryData(conversationQueries.realtime(accountId), next);
    if (reconcile) void client.invalidateQueries({ queryKey: conversationQueries.all(accountId) });
  };
  const reconnect = () => {
    source?.close();
    source = undefined;
    setConnected(false);
    if (!stopped && !retry)
      retry = setTimeout(
        () => {
          retry = undefined;
          start();
        },
        Math.min(30_000, 1000 * 2 ** Math.min(attempts++, 5)),
      );
  };
  const start = () => {
    if (stopped || typeof EventSource === "undefined") return;
    let stream: EventSource;
    try {
      stream = new EventSource(`/api/conversations/realtime?accountId=${encodeURIComponent(accountId)}`);
    } catch {
      reconnect();
      return;
    }
    source = stream;
    const active = () => !stopped && source === stream;
    stream.addEventListener("ready", () => {
      if (!active()) return;
      lastHeartbeat = Date.now();
      setConnected(true);
    });
    stream.addEventListener("heartbeat", () => {
      if (active()) {
        lastHeartbeat = Date.now();
        attempts = 0;
      }
    });
    for (const name of ["messageCreated", "unreadCountChanged", "conversationBlockChanged"] as const)
      stream.addEventListener(name, (event) => {
        if (!active()) return;
        lastHeartbeat = Date.now();
        try {
          if (!applyEvent(client, accountId, name, JSON.parse((event as MessageEvent<string>).data))) reconnect();
        } catch {
          reconnect();
        }
      });
    stream.onerror = () => {
      if (!active()) return;
      reconnect();
      // EventSource não expõe o status HTTP. O BFF comum confirma/renova a sessão
      // e dispara SESSION_EXPIRED quando necessário, mesmo fora da tela do chat.
      void bffClient.request({ method: "GET", path: "/users/me" }, sessionUserSchema).catch((error: unknown) => {
        // O stream pode já ter apagado os cookies: o proxy passa então o 401 anônimo da API.
        if (!stopped && isApiError(error) && error.status === 401 && error.code !== "SESSION_EXPIRED") notifySessionExpired();
      });
    };
  };
  const stop = () => {
    if (stopped) return;
    stopped = true;
    source?.close();
    source = undefined;
    clearTimeout(retry);
    clearInterval(watchdog);
    unsubscribeSession();
    unsubscribeCache();
    if (!cacheCleared) setConnected(false, false);
  };
  const watchdog = setInterval(() => {
    if (connected && Date.now() - lastHeartbeat > 45_000) reconnect();
  }, 15_000);
  const unsubscribeSession = onSessionExpired(() => {
    stop();
    if (connections.get(client)?.accountId === accountId) connections.delete(client);
  });
  const statusQuery = client.getQueryCache().find({ queryKey: conversationQueries.realtime(accountId), exact: true });
  const unsubscribeCache = client.getQueryCache().subscribe((event) => {
    if (event.type === "removed" && event.query === statusQuery) {
      cacheCleared = true;
      stop();
      if (connections.get(client)?.accountId === accountId) connections.delete(client);
    }
  });
  start();
  return stop;
}

function applyEvent(client: QueryClient, accountId: string, name: string, payload: unknown) {
  if (name === "messageCreated") {
    const parsed = messageDtoSchema.safeParse(payload);
    if (!parsed.success) return false;
    const message = toMessage(parsed.data);
    client.setQueryData(conversationQueries.messages(accountId, message.conversationId).queryKey, (data) =>
      withNewMessage(data, message),
    );
    void client.invalidateQueries({ queryKey: conversationQueries.summaries(accountId) });
    void client.invalidateQueries({ queryKey: conversationQueries.detail(accountId, message.conversationId).queryKey });
    void client.invalidateQueries({
      queryKey: conversationQueries.messages(accountId, message.conversationId).queryKey,
    });
  } else if (name === "unreadCountChanged") {
    const parsed = unreadSchema.safeParse(payload);
    if (!parsed.success) return false;
    client.setQueryData(conversationQueries.unreadCount(accountId).queryKey, parsed.data.total);
    void client.invalidateQueries({ queryKey: conversationQueries.mine(accountId).queryKey });
  } else {
    const parsed = blockedSchema.safeParse(payload);
    if (!parsed.success) return false;
    // Só o REST sabe blockedByMe/blockedByModeration: não inferir permissão pelo evento parcial.
    void client.invalidateQueries({
      queryKey: conversationQueries.detail(accountId, parsed.data.conversationId).queryKey,
    });
    void client.invalidateQueries({ queryKey: conversationQueries.mine(accountId).queryKey });
  }
  return true;
}
