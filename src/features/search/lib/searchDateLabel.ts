import { parseBrazilianDate } from "@/shared/lib/date/brazilianDate";

/** ISO de calendário para UTC; reutiliza a validação de dia/mês/ano compartilhada. */
function calendarTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = parseBrazilianDate(`${match[3]}${match[2]}${match[1]}`);
  return date ? Date.UTC(date.year, date.month - 1, date.day) : null;
}

/**
 * Valor legível da célula de datas da home (REQ-UIC-007), sem converter o ISO enviado à busca.
 * Calendário em UTC evita mudar o dia/noites por fuso ou horário de verão. Não valida a reserva.
 * @example searchDateLabel("2026-12-25", "departure", "2026-12-20") // "25 dez · 5 noites"
 */
export function searchDateLabel(value: string, edge: "arrival" | "departure", from?: string): string {
  const timestamp = calendarTimestamp(value);
  if (timestamp === null) return edge === "arrival" ? "Quando chega?" : "Quando volta?";
  const label = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short", timeZone: "UTC" })
    .format(timestamp)
    .replace(" de ", " ")
    .replace(".", "");
  if (edge === "arrival") return `${label}, a partir das 14h`;
  const start = calendarTimestamp(from ?? "");
  const nights = start === null ? 0 : (timestamp - start) / 86_400_000;
  return nights > 0 ? `${label} · ${nights} ${nights === 1 ? "noite" : "noites"}` : label;
}
