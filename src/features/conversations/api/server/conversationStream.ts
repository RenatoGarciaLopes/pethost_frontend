import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createBackendClient, forwardedForOf } from "@/shared/api/server/backendClient";
import { bffErrorResponse, bffLocalError } from "@/shared/api/server/bffResponse";
import { isApiError } from "@/shared/api/errors/ApiError";
import { sessionUserSchema } from "@/shared/auth/contracts/session";
import { readSessionTokens } from "@/shared/auth/server/sessionCookies";
import { getSessionGateway, type AccessResolution, type SessionGateway } from "@/shared/auth/server/sessionGateway";
import { applyAccessResolution, sessionExpiredResponse } from "@/shared/auth/server/sessionResponses";
import { getServerEnv, type ServerEnv } from "@/shared/config/env.server";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";

const EVENTS = new Set(["messageCreated", "unreadCountChanged", "conversationBlockChanged"]);
const SEPARATOR = "\u001e";

interface StreamDeps {
  env?: ServerEnv;
  gateway?: SessionGateway;
  userClient?: Pick<HttpTransport, "request">;
  socket?: (url: URL) => WebSocket;
}

/** Ponte somente de leitura: SignalR JSON/WebSocket no servidor → SSE autenticado no navegador. */
export async function conversationStream(request: NextRequest, deps: StreamDeps = {}) {
  const env = deps.env ?? getServerEnv();
  const origin = request.headers.get("origin");
  if (
    (origin && ![request.nextUrl.origin, ...env.appOrigins].includes(origin)) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return bffLocalError(403, "CSRF_REJECTED", "Cross-site request rejected");
  const accountId = request.nextUrl.searchParams.get("accountId");
  if (!accountId) return bffLocalError(400, "VALIDATION_ERROR", "Account required");
  const gateway = deps.gateway ?? getSessionGateway();
  const context = { forwardedFor: forwardedForOf(request.headers) };
  let access: AccessResolution | undefined;
  try {
    const tokens = readSessionTokens(request.cookies);
    access = await gateway.resolveAccess(tokens, context);
    if (access.status !== "valid" && access.status !== "renewed")
      return applyAccessResolution(sessionExpiredResponse(), access, request);
    // Identidade confirmada pela API; nunca autoriza por claims não verificadas ou pelo parâmetro do navegador.
    const loadUser = (accessToken: string) =>
      (deps.userClient ?? createBackendClient({ accessToken, ...context }, { env })).request(
        { method: "GET", path: "/users/me" },
        sessionUserSchema,
      );
    let user;
    try {
      user = await loadUser(access.accessToken);
    } catch (error) {
      if (!isApiError(error) || error.status !== 401 || access.status === "renewed" || !tokens.refreshToken)
        throw error;
      access = await gateway.forceRefresh(tokens.refreshToken, context);
      if (access.status !== "renewed") return applyAccessResolution(sessionExpiredResponse(), access, request);
      user = await loadUser(access.accessToken);
    }
    if (user.id !== accountId || !user.isActive || (user.role !== "owner" && user.role !== "host"))
      return applyAccessResolution(bffLocalError(403, "FORBIDDEN", "Account not allowed"), access, request);
    const url = new URL(`${env.backendUrl}/hubs/conversations`);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("access_token", access.accessToken);
    const stream = relay(url, request.signal, deps.socket ?? ((address) => new WebSocket(address)));
    return applyAccessResolution(
      new NextResponse(stream, {
        headers: {
          "content-type": "text/event-stream; charset=utf-8",
          "cache-control": "no-store, no-transform",
          "x-accel-buffering": "no",
        },
      }),
      access,
      request,
    );
  } catch (error) {
    const response = bffErrorResponse(error);
    return access ? applyAccessResolution(response, access, request) : response;
  }
}

/** Subconjunto push-only do protocolo oficial: handshake, invocation sem retorno, ping e close. */
function relay(url: URL, signal: AbortSignal, factory: (url: URL) => WebSocket) {
  let stop: () => void;
  let cancelled = false;
  return new ReadableStream<Uint8Array>(
    {
      start(controller) {
        const socket = factory(url);
        const encoder = new TextEncoder();
        let closed = false;
        let ready = false;
        let buffer = "";
        let lastReceived = Date.now();
        const emit = (event: string, payload: unknown) => {
          const chunk = encoder.encode(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
          if (closed) return;
          if ((controller.desiredSize ?? 0) < chunk.byteLength) return stop();
          controller.enqueue(chunk);
        };
        const timeout = setTimeout(() => stop(), 10_000);
        const heartbeat = setInterval(() => {
          if (!ready) return;
          if (Date.now() - lastReceived > 45_000 || socket.readyState !== 1) return stop();
          try {
            socket.send(`{"type":6}${SEPARATOR}`);
          } catch {
            return stop();
          }
          emit("heartbeat", {});
        }, 15_000);
        stop = () => {
          if (closed) return;
          closed = true;
          clearTimeout(timeout);
          clearInterval(heartbeat);
          signal.removeEventListener("abort", stop);
          socket.close();
          if (!cancelled) controller.close();
        };
        signal.addEventListener("abort", stop, { once: true });
        if (signal.aborted) return stop();
        controller.enqueue(encoder.encode(": connecting\n\n"));
        socket.addEventListener("open", () => {
          if (!closed) socket.send(`{"protocol":"json","version":1}${SEPARATOR}`);
        });
        socket.addEventListener("error", stop);
        socket.addEventListener("close", stop);
        socket.addEventListener("message", (event) => {
          if (closed) return;
          if (typeof event.data !== "string" || buffer.length + event.data.length > 262_144) return stop();
          lastReceived = Date.now();
          buffer += event.data;
          try {
            let boundary: number;
            while ((boundary = buffer.indexOf(SEPARATOR)) >= 0) {
              if (closed) return;
              const frame = JSON.parse(buffer.slice(0, boundary));
              buffer = buffer.slice(boundary + 1);
              if (!frame || typeof frame !== "object") return stop();
              if (!ready) {
                if ("error" in frame || frame.type !== undefined || Array.isArray(frame)) return stop();
                ready = true;
                clearTimeout(timeout);
                emit("ready", {});
              } else if (frame.type === 7) return stop();
              else if (
                frame.type === 1 &&
                EVENTS.has(frame.target) &&
                Array.isArray(frame.arguments) &&
                frame.arguments.length === 1
              )
                emit(frame.target, frame.arguments[0]);
            }
          } catch {
            stop();
          }
        });
      },
      cancel() {
        cancelled = true;
        stop();
      },
    },
    { highWaterMark: 262_144, size: (chunk) => chunk.byteLength },
  );
}
