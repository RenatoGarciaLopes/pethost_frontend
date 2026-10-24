import { describe, expect, it } from "vitest";
import { formatDayLabel, formatListTime, formatMessageTime, messageDay } from "./messageTime";

const NOW = new Date("2026-12-21T19:10:00Z"); // 16h10 de 21/12 em Brasília

describe("messageTime", () => {
  it("REQ-CHAT-005 hora da mensagem em Brasília, sem zero à esquerda e sem minutos na hora cheia", () => {
    expect(formatMessageTime("2026-12-21T19:02:00Z")).toBe("16h02");
    expect(formatMessageTime("2026-12-21T12:05:00Z")).toBe("9h05");
    expect(formatMessageTime("2026-12-21T12:00:00Z")).toBe("9h");
  });

  it("REQ-CHAT-004 o dia da mensagem é o de Brasília, não o de UTC", () => {
    expect(messageDay("2026-12-21T02:30:00Z")).toBe("2026-12-20");
    expect(messageDay("2026-12-21T03:00:00Z")).toBe("2026-12-21");
  });

  it("REQ-CHAT-004 títulos dos dias: Hoje, Ontem, dia e mês, e o ano quando é outro", () => {
    expect(formatDayLabel("2026-12-21", NOW)).toBe("Hoje");
    expect(formatDayLabel("2026-12-20", NOW)).toBe("Ontem");
    expect(formatDayLabel("2026-10-08", NOW)).toBe("8 out");
    expect(formatDayLabel("2025-10-08", NOW)).toBe("8 out 2025");
  });

  it("REQ-CHAT-001 na lista, a hora se foi hoje e o dia se foi antes", () => {
    expect(formatListTime("2026-12-21T19:02:00Z", NOW)).toBe("16h02");
    expect(formatListTime("2026-12-20T17:31:00Z", NOW)).toBe("Ontem");
    expect(formatListTime("2026-10-02T14:15:00Z", NOW)).toBe("2 out");
  });
});
