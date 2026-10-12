import { createRefreshHandlers } from "@/shared/auth/server/sessionHandlers";

const handlers = createRefreshHandlers();

/** Renovação pelo navegador. */
export const POST = handlers.POST;
/** Renovação vinda de um Server Component (`?next=`), que não pode gravar cookie (REQ-HTTP-016). */
export const GET = handlers.GET;
