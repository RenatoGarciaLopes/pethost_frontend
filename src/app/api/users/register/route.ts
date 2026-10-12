import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Cadastro da conta de anfitrião, já com sessão. */
export const POST = createSessionHandler({ backendPath: "/users/register", successStatus: 201 });
