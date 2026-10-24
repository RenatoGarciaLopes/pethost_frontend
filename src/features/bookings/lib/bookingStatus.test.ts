import { describe, expect, it } from "vitest";
import { BOOKING_STATUSES } from "../api/contracts";
import { HOST_TABS, hostTabOf, statusLabel, trailSteps } from "./bookingStatus";

describe("bookingStatus", () => {
  it("REQ-HREQ-001 toda situação tem nome curto", () => {
    for (const status of BOOKING_STATUSES) expect(statusLabel[status].length).toBeGreaterThan(3);
  });

  it("REQ-HREQ-001 abas do anfitrião: cada status cai numa aba só", () => {
    expect(HOST_TABS.map((tab) => [tab.id, tab.label, tab.statuses])).toEqual([
      ["pedidos", "Pedidos", ["requested"]],
      ["proximas", "Próximas", ["accepted", "confirmed"]],
      ["acontecendo", "Acontecendo", ["in_progress"]],
      ["anteriores", "Anteriores", ["completed", "declined", "expired", "cancelled"]],
    ]);
    expect(
      BOOKING_STATUSES.every((status) => HOST_TABS.filter((tab) => tab.statuses.includes(status)).length === 1),
    ).toBe(true);
  });

  it("REQ-STAYS-002 rótulos em texto, como o tutor lê", () => {
    expect(statusLabel).toEqual({
      requested: "Esperando resposta",
      accepted: "Aceita",
      confirmed: "Confirmada",
      in_progress: "Acontecendo",
      completed: "Concluída",
      declined: "Não aceita",
      expired: "Expirou",
      cancelled: "Cancelada",
    });
  });

  it("REQ-HREQ-001 aba da URL desconhecida cai em Pedidos", () => {
    expect(hostTabOf("acontecendo").id).toBe("acontecendo");
    expect(hostTabOf("qualquer").id).toBe("pedidos");
    expect(hostTabOf(undefined).id).toBe("pedidos");
  });

  it.each([
    ["requested", ["current", "todo", "todo", "todo"]],
    ["confirmed", ["done", "current", "todo", "todo"]],
    ["in_progress", ["done", "done", "current", "todo"]],
    ["completed", ["done", "done", "done", "done"]],
  ] as const)("REQ-STDAY-007 trilha em %s", (status, states) => {
    const steps = trailSteps(status);
    expect(steps?.map((step) => step.label)).toEqual(["Pedido", "Confirmada", "Chegou", "Voltou pra casa"]);
    expect(steps?.map((step) => step.state)).toEqual(states);
  });

  it("REQ-HREQ-001 recusada, expirada ou cancelada não tem trilha", () => {
    expect(trailSteps("declined")).toBeNull();
    expect(trailSteps("cancelled")).toBeNull();
  });
});
