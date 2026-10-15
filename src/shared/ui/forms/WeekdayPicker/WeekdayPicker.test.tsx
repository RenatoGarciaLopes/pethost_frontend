import { screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { WeekdayPicker, type Weekday } from "./WeekdayPicker";

function Harness({ initial = [] as Weekday[], onChange = vi.fn() }) {
  const [value, setValue] = useState<readonly Weekday[]>(initial);
  return (
    <WeekdayPicker
      label="Dias que recebe"
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("WeekdayPicker", () => {
  it("REQ-LIST-010 os 7 dias, de segunda a domingo, num grupo com nome", () => {
    renderWithProviders(<Harness initial={["saturday"]} />, { theme: quintalTheme });
    const group = screen.getByRole("group", { name: "Dias que recebe" });
    const days = within(group).getAllByRole("checkbox");
    expect(days.map((day) => day.getAttribute("aria-label") ?? day.closest("label")?.textContent)).toEqual([
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
      "Domingo",
    ]);
    expect(within(group).getByRole("checkbox", { name: "Sábado" })).toBeChecked();
  });

  it("REQ-LIST-010 marcar e desmarcar devolve os dias na ordem da semana", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness initial={["friday"]} onChange={onChange} />, { theme: quintalTheme });
    await user.click(screen.getByRole("checkbox", { name: "Segunda" }));
    expect(onChange).toHaveBeenLastCalledWith(["monday", "friday"]);
    await user.click(screen.getByRole("checkbox", { name: "Sexta" }));
    expect(onChange).toHaveBeenLastCalledWith(["monday"]);
  });

  it("REQ-LIST-010 'Todos os dias' marca a semana inteira", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} />, { theme: quintalTheme });
    await user.click(screen.getByRole("button", { name: "Todos os dias" }));
    expect(onChange).toHaveBeenLastCalledWith([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ]);
  });

  it("REQ-LIST-010 erro descreve o grupo", () => {
    renderWithProviders(<WeekdayPicker label="Dias" value={[]} onChange={vi.fn()} error="Escolhe ao menos um dia." />, {
      theme: quintalTheme,
    });
    expect(screen.getByRole("group", { name: "Dias" })).toHaveAccessibleDescription("Escolhe ao menos um dia.");
  });
});
