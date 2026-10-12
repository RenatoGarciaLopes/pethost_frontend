/**
 * Cabeçalho anti-CSRF que só o `bffClient` manda; um formulário de outro site não consegue enviá-lo.
 * Conferido no BFF por `isAllowedMutation` (REQ-HTTP-013).
 */
export const CSRF_HEADER = "x-pethost-request";
