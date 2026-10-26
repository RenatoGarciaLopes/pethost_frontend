const brasilia = "America/Sao_Paulo";

/** Formata um instante para leitura em português, sempre no fuso de Brasília.
 * @example formatDateTime("2026-10-09T12:00:00Z") // "09/10/2026, 09:00"
 */
export function formatDateTime(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: brasilia,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}
