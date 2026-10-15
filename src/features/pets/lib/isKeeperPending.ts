import { hasErrorCode } from "@/shared/api/errors/ApiError";
/** Perfil ainda não aprovado, distinguido dos demais 404. @example isKeeperPending(query.error) */
export function isKeeperPending(error: unknown): boolean {
  return hasErrorCode(error, "PET_KEEPER_NOT_FOUND");
}
