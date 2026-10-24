import type { ConversationMessage } from "../types";
import { formatDayLabel, messageDay } from "./messageTime";

/**
 * Um acontecimento que aparece entre as mensagens, sem ser mensagem (ex.: "Pipoca chegou · 14h18"). Quem conhece o
 * acontecimento (a estadia, no widget) monta o texto; a conversa só o põe no lugar certo do tempo.
 */
export interface TimelineEvent {
  id: string;
  /** Instante ISO do acontecimento. */
  at: string;
  label: string;
}

export type TimelineEntry = { kind: "message"; message: ConversationMessage } | { kind: "event"; event: TimelineEvent };

/** Um dia da conversa, já com o título ("Hoje", "Ontem", "8 out"). */
export interface TimelineDay {
  day: string;
  label: string;
  entries: TimelineEntry[];
}

const timeOf = (entry: TimelineEntry) =>
  Date.parse(entry.kind === "message" ? entry.message.createdAt : entry.event.at);

/**
 * Junta mensagens e acontecimentos em ordem de leitura (do mais antigo para o mais novo), agrupados por dia de
 * Brasília. Aceita as mensagens em qualquer ordem: a API manda da mais nova para a mais antiga. No mesmo instante,
 * o acontecimento vem antes da mensagem.
 *
 * @example buildTimeline(page.items, [{ id: "check-in", at: booking.checkedInAt, label: "Pipoca chegou" }], now)
 */
export function buildTimeline(
  messages: readonly ConversationMessage[],
  events: readonly TimelineEvent[] = [],
  now: Date = new Date(),
): TimelineDay[] {
  const entries: TimelineEntry[] = [
    ...events.map((event) => ({ kind: "event" as const, event })),
    ...messages.map((message) => ({ kind: "message" as const, message })),
  ].sort((left, right) => timeOf(left) - timeOf(right));

  const days: TimelineDay[] = [];
  for (const entry of entries) {
    const day = messageDay(new Date(timeOf(entry)));
    const current = days.at(-1);
    if (current?.day === day) current.entries.push(entry);
    else days.push({ day, label: formatDayLabel(day, now), entries: [entry] });
  }
  return days;
}
