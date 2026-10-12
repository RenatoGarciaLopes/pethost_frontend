import { z } from "zod";
import { unwrapData } from "@/shared/api/contracts/unwrapData";
import { PostApiV1AuthSessionsLoginResponse } from "@/shared/api/generated/sessions/sessions.zod";

/** Papéis da API. O OpenAPI descreve como string livre; o front estreita aqui. */
export const accountRoleSchema = z.enum(["owner", "host", "admin"]);
export type AccountRole = z.infer<typeof accountRoleSchema>;

const generatedSession = unwrapData(PostApiV1AuthSessionsLoginResponse);

/** Conta da sessão (`user` da resposta de sessão e de `GET /users/me`). */
export const sessionUserSchema = generatedSession.shape.user.extend({ role: accountRoleSchema });
export type SessionUser = z.infer<typeof sessionUserSchema>;

/**
 * Resposta de sessão da API (login, cadastro, refresh, reativação, troca de conta e de senha).
 * Só o servidor vê este formato: o navegador recebe apenas `user`.
 */
export const sessionSchema = generatedSession.extend({ user: sessionUserSchema });
export type Session = z.infer<typeof sessionSchema>;

/** O que o BFF devolve ao navegador depois de abrir uma sessão. */
export const sessionResultSchema = z.object({ user: sessionUserSchema });
export type SessionResult = z.infer<typeof sessionResultSchema>;

const nestedAccountSchema = z.object({ user: sessionUserSchema.nullish() }).passthrough().nullish();

/**
 * Corpo das rotas que abrem sessão. Nem todas devolvem `user` no topo (spec 003, T15):
 * `owners/register` e `owners/reactivate` trazem `owner.user`; `hosts/reactivate` traz `host.user`,
 * e `host` vem `null` para anfitrião ainda não aprovado. Use `userOfSessionPayload` para achar o usuário.
 */
export const sessionPayloadSchema = generatedSession.omit({ user: true }).extend({
  user: sessionUserSchema.optional(),
  owner: nestedAccountSchema,
  host: nestedAccountSchema,
});
export type SessionPayload = z.infer<typeof sessionPayloadSchema>;

/** Usuário da sessão onde quer que a rota o devolva; `undefined` quando a API não mandou. */
export function userOfSessionPayload(payload: SessionPayload): SessionUser | undefined {
  return payload.user ?? payload.owner?.user ?? payload.host?.user ?? undefined;
}
