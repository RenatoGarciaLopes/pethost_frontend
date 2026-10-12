import { createLogoutHandler } from "@/shared/auth/server/sessionHandlers";

/** Logout: revoga o refresh token na API e apaga os cookies. */
export const POST = createLogoutHandler();
