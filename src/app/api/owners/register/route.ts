import { createSessionHandler } from "@/shared/auth/server/sessionHandlers";

/** Cadastro de tutor, já com sessão. */
export const POST = createSessionHandler({ backendPath: "/owners/register", successStatus: 201 });
