import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { StatusTimeline } from "./StatusTimeline";

const steps = [
  { id: "sent", label: "Enviado", state: "done" },
  { id: "review", label: "Em análise", state: "current" },
  { id: "approved", label: "Aprovado", state: "todo" },
] as const;

describe("StatusTimeline", () => {
  it("REQ-HVER-012 lista ordenada com nome, e cada etapa diz em texto se foi feita, é agora ou falta", () => {
    renderWithProviders(<StatusTimeline label="Andamento da verificação" steps={steps} />, { theme: quintalTheme });
    const list = screen.getByRole("list", { name: "Andamento da verificação" });
    expect(list.tagName).toBe("OL");
    const items = within(list).getAllByRole("listitem");
    expect(items.map((item) => item.textContent)).toEqual(["Enviado, feito", "Em análise, agora", "Aprovado, falta"]);
  });

  it("REQ-HVER-012 a etapa atual é marcada com aria-current", () => {
    renderWithProviders(<StatusTimeline label="Andamento" steps={steps} />, { theme: quintalTheme });
    const current = screen.getAllByRole("listitem").filter((item) => item.getAttribute("aria-current") === "step");
    expect(current.map((item) => item.textContent)).toEqual(["Em análise, agora"]);
  });
});
