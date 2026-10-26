import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { StatusTimeline, type TimelineStep } from "./StatusTimeline";

const steps: TimelineStep[] = [
  { id: "sent", label: "Enviado", state: "done", detail: "10 de dez., 9h" },
  { id: "review", label: "Em análise", state: "current" },
  { id: "approved", label: "Aprovado", state: "todo", detail: "dom., 20 de dez." },
];

const items = (list: TimelineStep[]) => {
  renderWithProviders(<StatusTimeline label="Andamento" steps={list} />, { theme: quintalTheme });
  const ol = screen.getByRole("list", { name: "Andamento" });
  return { ol, items: within(ol).getAllByRole("listitem") };
};

describe("StatusTimeline", () => {
  it("REQ-HVER-012 lista ordenada em que cada etapa diz em texto feito, agora ou falta, com o detalhe quando há", () => {
    const { ol, items: li } = items(steps);
    expect(ol.tagName).toBe("OL");
    expect(li.map((item) => item.textContent)).toEqual([
      "Enviado, feito10 de dez., 9h",
      "Em análise, agora",
      "Aprovado, faltadom., 20 de dez.",
    ]);
  });

  it("REQ-HVER-012 só a etapa atual leva aria-current", () => {
    const { items: li } = items(steps);
    expect(li.map((item) => item.getAttribute("aria-current"))).toEqual([null, "step", null]);
  });

  it("REQ-STAYS-011 etapa que fecha: diz que parou, sem aria-current e sem etapas depois", () => {
    const { items: li } = items([
      { id: "ask", label: "Pedido", state: "done" },
      { id: "declined", label: "Não aceita", state: "stopped" },
    ]);
    expect(li.map((item) => item.textContent)).toEqual(["Pedido, feito", "Não aceita, parou"]);
    expect(li.some((item) => item.hasAttribute("aria-current"))).toBe(false);
  });

  it("REQ-STAYS-011 nada na trilha é controle", () => {
    items(steps);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
