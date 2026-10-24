import { conversationsCopy } from "./conversationsCopy";

const BRASILIA = "America/Sao_Paulo";
const DAY_MS = 24 * 60 * 60 * 1000;

const hourMinute = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: BRASILIA,
});
const calendarDay = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: BRASILIA,
});
const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: "UTC" });

const toDate = (value: Date | string) => (value instanceof Date ? value : new Date(value));
const monthOf = (date: Date) => shortMonth.format(date).replace(".", "");

/**
 * O dia de calendário do instante, em Brasília (`yyyy-MM-dd`). Agrupa as mensagens por dia.
 * @example messageDay("2026-12-21T02:30:00Z") // "2026-12-20" (23h30 do dia 20 em Brasília)
 */
export function messageDay(value: Date | string): string {
  return calendarDay.format(toDate(value));
}

/**
 * Hora da mensagem em Brasília, no jeito do app: "16h02", "9h05" ou "9h" na hora cheia.
 * @example formatMessageTime(message.createdAt) // "16h02"
 */
export function formatMessageTime(value: Date | string): string {
  const [hour, minute] = hourMinute.format(toDate(value)).split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

/** Dias inteiros entre dois dias de calendário `yyyy-MM-dd`. */
function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS);
}

/**
 * Título de um dia da conversa: "Hoje", "Ontem", "8 out" ou, em outro ano, "8 out 2025".
 * @example formatDayLabel(messageDay(message.createdAt), now) // "Ontem"
 */
export function formatDayLabel(day: string, now: Date = new Date()): string {
  const distance = daysBetween(day, messageDay(now));
  if (distance === 0) return conversationsCopy.today;
  if (distance === 1) return conversationsCopy.yesterday;
  const date = new Date(`${day}T00:00:00Z`);
  const label = `${date.getUTCDate()} ${monthOf(date)}`;
  return day.slice(0, 4) === messageDay(now).slice(0, 4) ? label : `${label} ${date.getUTCFullYear()}`;
}

/**
 * Quando foi a última mensagem, na lista: a hora se foi hoje, senão o dia ("8 out").
 * @example formatListTime(conversation.lastMessageAt, now) // "16h02"
 */
export function formatListTime(value: Date | string, now: Date = new Date()): string {
  const day = messageDay(value);
  return day === messageDay(now) ? formatMessageTime(value) : formatDayLabel(day, now);
}
