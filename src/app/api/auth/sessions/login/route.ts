import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Login: grava a sessão em cookies HttpOnly e devolve só o usuário (spec 003, REQ-HTTP-007). */
export const POST = createSessionHandler({ backendPath: "/auth/sessions/login" });
