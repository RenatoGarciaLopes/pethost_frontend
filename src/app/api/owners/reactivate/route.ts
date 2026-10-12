import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Reativação da conta de tutor com as credenciais; abre a sessão. */
export const POST = createSessionHandler({ backendPath: "/owners/reactivate" });
