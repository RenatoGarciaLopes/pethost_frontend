import { isApiError } from "@/shared/api/errors/ApiError";
import { searchCopy } from "./searchCopy";

/** Erro serializável de SSR, sem mensagem técnica. @example { code: "VALIDATION_ERROR", status: 400, fields: { where: "Confere a cidade." } } */
export interface SearchError {
  code: string;
  status: number;
  fields: Record<string, string>;
}
/** Erros 400 voltam aos controles; os demais viram Notice. @example toSearchError(error) */
export function toSearchError(error: unknown): SearchError {
  if (!isApiError(error)) return { code: "UNKNOWN", status: 0, fields: {} };
  const aliases: Record<string, string> = {
    checkIn: "from",
    checkOut: "to",
    city: "where",
    radiusKm: "radius",
    pets: "count",
  };
  const fields = Object.fromEntries(
    Object.keys(error.fieldIssues).map((key) => {
      const field = key.split(".").at(-1)!;
      const normalized = field[0]!.toLowerCase() + field.slice(1);
      return [aliases[normalized] ?? normalized, searchCopy.filterError];
    }),
  );
  return { code: error.code, status: error.status, fields };
}
