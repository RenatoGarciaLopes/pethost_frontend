import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Troca de senha logado: a API encerra as outras sessões e devolve uma nova. */
export const POST = createSessionHandler({ backendPath: "/users/me/password", authenticated: true });
