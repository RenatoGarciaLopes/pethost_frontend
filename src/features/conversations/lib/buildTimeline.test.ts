import { describe, expect, it } from "vitest";
import { CONVERSATIONS_NOW, messageDto } from "@/test/fixtures/conversations";
import { messageDtoSchema } from "../api/contracts";
import { toMessage } from "../api/mappers";
import { buildTimeline } from "./buildTimeline";

const message = (overrides: Record<string, unknown>) => toMessage(messageDtoSchema.parse(messageDto(overrides)));

describe("buildTimeline", () => {
  it("REQ-CHAT-004 põe em ordem de leitura e agrupa por dia, mesmo vindo da mais nova para a mais antiga", () => {
    const newest = message({ body: "Hoje tem jogo", createdAt: "2026-12-21T19:03:00Z" });
    const today = message({ body: "Brincou a tarde toda", createdAt: "2026-12-21T19:02:00Z" });
    const yesterday = message({ body: "A Pipoca chegou!", createdAt: "2026-12-20T17:20:00Z" });

    const days = buildTimeline([newest, today, yesterday], [], CONVERSATIONS_NOW);

    expect(days.map((day) => day.label)).toEqual(["Ontem", "Hoje"]);
    expect(days[1]?.entries.map((entry) => entry.kind === "message" && entry.message.body)).toEqual([
      "Brincou a tarde toda",
      "Hoje tem jogo",
    ]);
  });

  it("REQ-CHAT-011 encaixa o acontecimento da estadia no momento certo entre as mensagens", () => {
    const before = message({ body: "Saindo de casa", createdAt: "2026-12-20T16:00:00Z" });
    const after = message({ body: "Chegou bem", createdAt: "2026-12-20T17:20:00Z" });
    const days = buildTimeline(
      [after, before],
      [{ id: "check-in", at: "2026-12-20T17:18:00Z", label: "Pipoca chegou" }],
      CONVERSATIONS_NOW,
    );

    expect(days).toHaveLength(1);
    expect(days[0]?.entries.map((entry) => entry.kind)).toEqual(["message", "event", "message"]);
  });

  it("REQ-CHAT-004 conversa sem nada vira lista vazia", () => {
    expect(buildTimeline([], [], CONVERSATIONS_NOW)).toEqual([]);
  });
});
