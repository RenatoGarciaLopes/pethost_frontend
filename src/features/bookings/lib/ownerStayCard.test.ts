import { describe, expect, it } from "vitest";
import { bookingDto, PIPOCA_ID, THOR_ID } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../api/contracts";
import { toBooking } from "../api/mappers";
import type { Booking } from "../types";
import { ownerStayView, sortOwnerStays } from "./ownerStayCard";

const NOW = new Date("2026-12-11T15:00:00-03:00");
const stay = (overrides: Record<string, unknown> = {}): Booking =>
  toBooking(bookingDtoSchema.parse(bookingDto({ responseDeadline: null, ...overrides })));
const total = (view: ReturnType<typeof ownerStayView>) => view.summary.replace(/\s/g, " ");

describe("ownerStayView", () => {
  it("REQ-STAYS-010 aceita: selo gema, prazo de pagamento em destaque e a ação Pagar", () => {
    const view = ownerStayView(stay({ status: "accepted", paymentDeadline: "2026-12-11T18:40:00-03:00" }), NOW);
    expect(view).toMatchObject({
      title: "Pipoca na casa de Aparecida Souza",
      statusLabel: "Aceita · falta pagar",
      tone: "gema",
      context: { kind: "deadline", text: "Pague até hoje às 18h40 pra garantir a vaga." },
      action: "pay",
    });
    expect(total(view)).toBe("20 a 25 de dez. · 5 noites · R$ 300,00");
  });

  it("REQ-STAYS-010 aceita sem prazo na resposta não inventa linha de contexto", () => {
    expect(ownerStayView(stay({ status: "accepted" }), NOW).context).toBeNull();
  });

  it.each([
    ["requested", "Esperando resposta", "neutro"],
    ["confirmed", "Confirmada", "info"],
    ["in_progress", "Em andamento", "info"],
    ["completed", "Concluída", "ok"],
  ] as const)("REQ-STAYS-010 %s: selo %s e nenhuma ação sem tela", (status, label, tone) => {
    const view = ownerStayView(stay({ status }), NOW);
    expect(view).toMatchObject({ statusLabel: label, tone, action: null });
  });

  it("REQ-STAYS-010 esperando resposta mostra até quando o anfitrião responde", () => {
    const view = ownerStayView(stay({ status: "requested", responseDeadline: "2026-12-12T09:00:00-03:00" }), NOW);
    expect(view.context).toEqual({ kind: "note", text: "Aparecida Souza responde até amanhã às 9h" });
  });

  it("REQ-STAYS-010 expirada: sem resposta e sem pagamento contam histórias diferentes; as duas levam à busca", () => {
    const noAnswer = ownerStayView(stay({ status: "expired" }), NOW);
    expect(noAnswer).toMatchObject({
      statusLabel: "Expirada",
      tone: "atencao",
      action: "search",
      context: { text: "Aparecida Souza não respondeu em 24 horas. Nada foi cobrado." },
    });
    const noPayment = ownerStayView(stay({ status: "expired", respondedAt: "2026-12-10T13:00:00+00:00" }), NOW);
    expect(noPayment.context?.text).toBe("O prazo de pagamento passou. Nada foi cobrado.");
  });

  it("REQ-STAYS-010 não aceita e cancelada: nada foi cobrado, reembolso quando houver, e a busca", () => {
    expect(ownerStayView(stay({ status: "declined" }), NOW)).toMatchObject({
      action: "search",
      context: { text: "Aparecida Souza não pôde receber dessa vez. Nada foi cobrado." },
    });
    expect(ownerStayView(stay({ status: "cancelled", refundPercentage: 50 }), NOW).context?.text).toBe(
      "Estadia cancelada. Reembolso de 50%.",
    );
    expect(ownerStayView(stay({ status: "cancelled" }), NOW).context?.text).toBe("Estadia cancelada.");
  });

  it("REQ-STAYS-010 título: vários pets, sem anfitrião e sem pet nomeado", () => {
    const two = [
      { id: PIPOCA_ID, name: "Pipoca", species: "dog", size: "small" },
      { id: THOR_ID, name: "Mel", species: "cat", size: null },
    ];
    expect(ownerStayView(stay({ pets: two }), NOW).title).toBe("Pipoca e Mel na casa de Aparecida Souza");
    expect(ownerStayView(stay({ host: null }), NOW).title).toBe("Pipoca");
    expect(ownerStayView(stay({ pets: [{ id: PIPOCA_ID, name: null, species: null, size: null }] }), NOW).title).toBe(
      "Casa da Cida",
    );
    expect(ownerStayView(stay({ pets: [], listing: null }), NOW).title).toBe("Cantinho fora do ar");
  });
});

describe("sortOwnerStays", () => {
  it("REQ-STAYS-010 pagar primeiro, depois acontecendo, confirmadas, esperando, concluídas e as que não aconteceram", () => {
    const stays = (
      ["cancelled", "completed", "requested", "confirmed", "in_progress", "accepted", "expired"] as const
    ).map((status, index) => stay({ id: `0199f0a0-0000-7000-8000-00000000030${index}`, status }));
    expect(sortOwnerStays(stays).map((booking) => booking.status)).toEqual([
      "accepted",
      "in_progress",
      "confirmed",
      "requested",
      "completed",
      "cancelled",
      "expired",
    ]);
  });

  it("REQ-STAYS-010 dentro do mesmo grupo mantém a ordem da API e não muda a lista recebida", () => {
    const first = stay({ id: "0199f0a0-0000-7000-8000-000000000311", status: "completed" });
    const second = stay({ id: "0199f0a0-0000-7000-8000-000000000312", status: "completed" });
    const pay = stay({ id: "0199f0a0-0000-7000-8000-000000000313", status: "accepted" });
    const input = [first, second, pay];
    expect(sortOwnerStays(input).map((booking) => booking.id)).toEqual([pay.id, first.id, second.id]);
    expect(input.map((booking) => booking.id)).toEqual([first.id, second.id, pay.id]);
  });
});
