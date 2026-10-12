import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Troca para a outra conta da mesma pessoa (tutor ↔ anfitrião); precisa de sessão. */
export const POST = createSessionHandler({
  backendPath: "/auth/sessions/switch",
  authenticated: true,
  revokePreviousRefresh: true,
});
