import { describe, expect, it } from "vitest";
import { bookingDto } from "@/test/fixtures/bookings";
import { bookingDtoSchema } from "../api/contracts";
import { toBooking } from "../api/mappers";
import type { Booking } from "../types";
import { stayNow, stayTrail } from "./stayDetailView";

const NOW = new Date("2026-12-10T15:00:00Z");
const stay = (overrides: Record<string, unknown> = {}): Booking =>
  toBooking(bookingDtoSchema.parse(bookingDto({ responseDeadline: null, ...overrides })));

describe("stayTrail", () => {
  it("REQ-STAYS-011 pedido esperando: o pedido é o atual e os outros mostram o dia previsto", () => {
    const steps = stayTrail(stay({ status: "requested" }));
    expect(steps.map((step) => [step.label, step.state])).toEqual([
      ["Pedido", "current"],
      ["Confirmada", "todo"],
      ["Chegou", "todo"],
      ["Voltou pra casa", "todo"],
    ]);
    expect(steps[2]!.detail).toBe("dom., 20 de dez.");
    expect(steps[3]!.detail).toBe("sex., 25 de dez.");
  });

  it("REQ-STAYS-011 em andamento: passados com o momento, o atual sem inventar hora, o futuro previsto", () => {
    const steps = stayTrail(
      stay({
        status: "in_progress",
        requestedAt: "2026-12-10T12:00:00Z",
        confirmedAt: "2026-12-10T17:30:00Z",
        checkedInAt: "2026-12-20T15:00:00Z",
      }),
    );
    expect(steps.map((step) => step.state)).toEqual(["done", "done", "current", "todo"]);
    expect(steps[0]!.detail).toBe("10 de dez., 9h");
    expect(steps[1]!.detail).toBe("10 de dez., 14h30");
    expect(steps[2]!.detail).toBe("20 de dez., 12h");
    expect(steps[3]!.detail).toBe("sex., 25 de dez.");
  });

  it("REQ-STAYS-011 concluída: tudo feito", () => {
    expect(stayTrail(stay({ status: "completed" })).every((step) => step.state === "done")).toBe(true);
  });

  it("REQ-STAYS-011 recusada, expirada e cancelada acabam onde pararam, sem etapas futuras", () => {
    const shape = (overrides: Record<string, unknown>) =>
      stayTrail(stay(overrides)).map((step) => [step.label, step.state]);
    expect(shape({ status: "declined" })).toEqual([
      ["Pedido", "done"],
      ["Não aceita", "stopped"],
    ]);
    expect(shape({ status: "expired" })).toEqual([
      ["Pedido", "done"],
      ["Expirou", "stopped"],
    ]);
    expect(shape({ status: "cancelled", confirmedAt: "2026-12-10T17:30:00Z" })).toEqual([
      ["Pedido", "done"],
      ["Confirmada", "done"],
      ["Cancelada", "stopped"],
    ]);
  });
});

describe("stayNow", () => {
  it("REQ-STAYS-011 a frase de cada etapa e a ação que existe", () => {
    expect(stayNow(stay({ status: "requested", responseDeadline: "2026-12-11T12:00:00Z" }), NOW)).toMatchObject({
      title: "Aparecida Souza responde até amanhã às 9h.",
      details: ["O pedido ainda não segura a vaga."],
      action: null,
    });
    expect(stayNow(stay({ status: "accepted", paymentDeadline: "2026-12-10T21:30:00Z" }), NOW)).toMatchObject({
      title: "Pague até hoje às 18h30 pra garantir a vaga.",
      action: "pay",
    });
    expect(stayNow(stay({ status: "accepted" }), NOW).title).toBe("Falta pagar pra garantir a vaga.");
    expect(stayNow(stay({ status: "confirmed" }), NOW)).toMatchObject({
      title: "Tudo certo. A chegada é dom., 20 de dez.",
      action: "viewPayment",
    });
    expect(stayNow(stay({ status: "in_progress" }), NOW).title).toBe(
      "Seu pet está na casa de Aparecida Souza. A saída é sex., 25 de dez.",
    );
    expect(stayNow(stay({ status: "completed" }), NOW).action).toBe("viewPayment");
    expect(stayNow(stay({ status: "in_progress" }), NOW).action).toBe("viewPayment");
  });

  it("REQ-STAYS-011 fora do trilho: o que houve, nada cobrado e o caminho da busca", () => {
    expect(stayNow(stay({ status: "declined", declineReason: "Casa cheia" }), NOW)).toMatchObject({
      heading: "O que aconteceu",
      title: "Aparecida Souza não pôde receber dessa vez.",
      details: ["Motivo: Casa cheia", "Nada foi cobrado."],
      action: "search",
    });
    expect(stayNow(stay({ status: "expired" }), NOW)).toMatchObject({
      title: "Aparecida Souza não respondeu a tempo.",
      details: ["Nada foi cobrado."],
      action: "search",
    });
    expect(stayNow(stay({ status: "expired", respondedAt: "2026-12-10T13:00:00Z" }), NOW).title).toBe(
      "O prazo de pagamento passou.",
    );
    expect(stayNow(stay({ status: "cancelled", refundPercentage: 50 }), NOW)).toMatchObject({
      title: "Estadia cancelada.",
      details: ["Reembolso de 50%"],
      action: null,
    });
  });
});
