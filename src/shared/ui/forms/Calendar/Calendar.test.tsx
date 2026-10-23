import { screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Calendar, type CalendarProps } from "./Calendar";
import type { RangeValue } from "./calendarDates";

const day = (label: string) => screen.getByRole("button", { name: new RegExp(`, ${label}( |,|$)`) });
const iso = (value: string) => document.querySelector<HTMLElement>(`[data-iso="${value}"]`)!;

function Range({ initial = { start: "", end: "" } }: { initial?: RangeValue }) {
  const [value, setValue] = useState(initial);
  return (
    <Calendar
      mode="range"
      months={2}
      value={value}
      onChange={setValue}
      today="2026-10-15"
      min="2026-10-15"
      max="2027-10-15"
      maxNights={30}
    />
  );
}
const single = (props: Partial<Extract<CalendarProps, { mode: "single" }>> = {}) => (
  <Calendar mode="single" value="" onChange={vi.fn()} today="2026-10-15" {...props} />
);

describe("Calendar (REQ-CAL-004 apresentação e bloqueios)", () => {
  it("grade acessível com dois meses, dias da semana por nome e hoje marcado", () => {
    renderWithProviders(single({ months: 2 }));
    expect(screen.getAllByRole("grid").map((grid) => grid.getAttribute("aria-label"))).toEqual([
      "outubro de 2026",
      "novembro de 2026",
    ]);
    expect(screen.getAllByRole("columnheader", { name: "domingo" })).toHaveLength(2);
    expect(day("15 de outubro de 2026, hoje")).toHaveAttribute("aria-current", "date");
  });

  it("dia antes do mínimo e dia de isDisabled ficam apagados e não escolhem", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      single({ onChange, min: "2026-10-15", isDisabled: (value) => value === "2026-10-20" }),
    );
    for (const blocked of ["14 de outubro de 2026", "20 de outubro de 2026"]) {
      expect(day(blocked)).toHaveAttribute("aria-disabled", "true");
      await user.click(day(blocked));
    }
    expect(onChange).not.toHaveBeenCalled();
    await user.click(day("16 de outubro de 2026"));
    expect(onChange).toHaveBeenCalledWith("2026-10-16");
  });

  it("setas do cabeçalho trocam o mês, param no mínimo e o ano pula doze meses", async () => {
    const { user } = renderWithProviders(single({ min: "2026-10-15" }));
    expect(screen.getByRole("button", { name: "Mês anterior" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Próximo mês" }));
    expect(screen.getByRole("grid", { name: "novembro de 2026" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Próximo ano" }));
    expect(screen.getByRole("grid", { name: "novembro de 2027" })).toBeInTheDocument();
  });

  it("data de anos atrás: o título abre os anos e um toque leva ao ano, parando no máximo", async () => {
    const { user } = renderWithProviders(single({ max: "2026-10-15" }));
    await user.click(screen.getByRole("button", { name: /outubro de 2026, Escolher o ano/ }));
    expect(screen.getByRole("button", { name: "2026" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByRole("button", { name: "2027" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "2005" }));
    expect(screen.getByRole("grid", { name: "outubro de 2005" })).toBeInTheDocument();
  });

  it("Limpar aparece só com data escolhida e chama onClear", async () => {
    const onClear = vi.fn();
    const { user, rerender } = renderWithProviders(single({ onClear }));
    expect(screen.queryByRole("button", { name: "Limpar" })).not.toBeInTheDocument();
    rerender(single({ onClear, value: "2026-10-20" }));
    await user.click(screen.getByRole("button", { name: "Limpar" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("Calendar (REQ-CAL-005 intervalo)", () => {
  it("chegada, depois saída: rótulos, faixa do meio e resumo no tom da casa", async () => {
    const { user } = renderWithProviders(<Range />);
    expect(screen.getByText("Escolhe o dia da chegada.")).toBeInTheDocument();
    await user.click(day("20 de outubro de 2026"));
    expect(day("20 de outubro de 2026, chegada")).toBeInTheDocument();
    await user.click(day("25 de outubro de 2026"));
    expect(day("25 de outubro de 2026, saída")).toBeInTheDocument();
    expect(screen.getByText("5 noites · 20 a 25 out")).toBeInTheDocument();
    expect(iso("2026-10-22").closest('[role="gridcell"]')).toHaveAttribute("aria-selected", "true");
  });

  it("depois do limite de 30 noites o dia apaga, não escolhe e o rodapé explica o limite", async () => {
    const { user } = renderWithProviders(<Range initial={{ start: "2026-10-20", end: "" }} />);
    expect(screen.getByText(/até 30 noites, então o último dia é 19 nov/)).toBeInTheDocument();
    expect(day("19 de novembro de 2026")).not.toHaveAttribute("aria-disabled");
    expect(day("20 de novembro de 2026")).toHaveAttribute("aria-disabled", "true");
    await user.click(day("20 de novembro de 2026"));
    expect(screen.queryByText(/noites ·/)).not.toBeInTheDocument();
  });

  it("editando a saída, um dia depois da chegada troca só a saída e completa", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <Calendar
        mode="range"
        value={{ start: "2026-10-20", end: "2026-10-25" }}
        onChange={onChange}
        editing="end"
        today="2026-10-15"
        maxNights={30}
      />,
    );
    await user.click(day("28 de outubro de 2026"));
    expect(onChange).toHaveBeenCalledWith({ start: "2026-10-20", end: "2026-10-28" }, true);
  });
});

describe("Calendar (REQ-CAL-006 teclado, padrão de grade de datas)", () => {
  it("só o dia ativo fica na ordem de tabulação (roving tabindex)", () => {
    renderWithProviders(single({ value: "2026-10-20" }));
    const tabbable = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("tabindex") === "0" && button.dataset.iso);
    expect(tabbable.map((button) => button.dataset.iso)).toEqual(["2026-10-20"]);
  });

  it("setas, Home e End movem o foco e a seta além do mês troca o mês", async () => {
    const { user } = renderWithProviders(single({ value: "2026-10-14", autoFocus: true }));
    expect(iso("2026-10-14")).toHaveFocus();
    await user.keyboard("{ArrowRight}{ArrowDown}");
    expect(iso("2026-10-22")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(iso("2026-10-18")).toHaveFocus();
    await user.keyboard("{End}");
    expect(iso("2026-10-24")).toHaveFocus();
    await user.keyboard("{ArrowDown}{ArrowDown}");
    expect(screen.getByRole("grid", { name: "novembro de 2026" })).toBeInTheDocument();
    expect(iso("2026-11-07")).toHaveFocus();
  });

  it("PageDown/PageUp trocam o mês, Shift troca o ano e o foco para no limite", async () => {
    const { user } = renderWithProviders(single({ value: "2026-10-31", min: "2026-10-15", autoFocus: true }));
    await user.keyboard("{PageDown}");
    expect(iso("2026-11-30")).toHaveFocus();
    await user.keyboard("{PageUp}{PageUp}{ArrowLeft}");
    expect(iso("2026-10-15")).toHaveFocus();
    await user.keyboard("{Shift>}{PageDown}{/Shift}");
    expect(iso("2027-10-15")).toHaveFocus();
  });

  it("Enter e Espaço escolhem o dia em foco", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(single({ value: "2026-10-20", onChange, autoFocus: true }));
    await user.keyboard("{ArrowRight}{Enter}");
    expect(onChange).toHaveBeenLastCalledWith("2026-10-21");
    await user.keyboard("{ArrowRight} ");
    expect(onChange).toHaveBeenLastCalledWith("2026-10-22");
  });
});
