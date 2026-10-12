import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Reativação da conta de anfitrião com as credenciais; abre a sessão. */
export const POST = createSessionHandler({ backendPath: "/hosts/reactivate" });
