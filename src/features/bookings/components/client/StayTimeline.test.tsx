import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import type { StayTrailStep } from "../../lib/stayDetailView";
import { StayTimeline } from "./StayTimeline";

const steps: StayTrailStep[] = [
  { id: "a", label: "Pedido", state: "done", when: "10 de dez., 9h" },
  { id: "b", label: "Confirmada", state: "current", when: null },
  { id: "c", label: "Chegou", state: "todo", when: "previsto dom., 20 de dez." },
];

describe("StayTimeline", () => {
  it("REQ-STAYS-011 lista ordenada: a etapa atual leva aria-current e cada etapa diz em texto feito, agora ou falta", () => {
    renderWithProviders(<StayTimeline label="Andamento da estadia" steps={steps} />, { theme: quintalTheme });
    const items = within(screen.getByRole("list", { name: "Andamento da estadia" })).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items.map((item) => item.getAttribute("aria-current"))).toEqual([null, "step", null]);
    expect(items[0]).toHaveTextContent("Pedido, feito");
    expect(items[0]).toHaveTextContent("10 de dez., 9h");
    expect(items[1]).toHaveTextContent("Confirmada, agora");
    expect(items[2]).toHaveTextContent("Chegou, falta");
    expect(items[2]).toHaveTextContent("previsto dom., 20 de dez.");
  });

  it("REQ-STAYS-011 nada na trilha é controle", () => {
    renderWithProviders(<StayTimeline label="Andamento da estadia" steps={steps} />, { theme: quintalTheme });
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
