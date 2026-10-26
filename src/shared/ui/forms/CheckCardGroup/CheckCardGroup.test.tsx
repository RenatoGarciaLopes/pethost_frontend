import { screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { CheckCardGroup } from "./CheckCardGroup";

const options = [
  { value: "small", label: "Pequeno", description: "até 10 kg" },
  { value: "medium", label: "Médio", description: "10 a 25 kg" },
  { value: "large", label: "Grande", disabled: true },
];

function Harness({ onChange = vi.fn(), initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <CheckCardGroup
      label="Portes"
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe("CheckCardGroup", () => {
  it("REQ-DS-009 grupo com legenda; marcar e desmarcar devolve na ordem das opções", async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(<Harness onChange={onChange} initial={["medium"]} />, { theme: quintalTheme });
    expect(screen.getByRole("group", { name: "Portes" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Médio. 10 a 25 kg" })).toBeChecked();
    await user.click(screen.getByRole("checkbox", { name: /Pequeno/ }));
    expect(onChange).toHaveBeenLastCalledWith(["small", "medium"]);
    await user.click(screen.getByRole("checkbox", { name: /Médio/ }));
    expect(onChange).toHaveBeenLastCalledWith(["small"]);
    expect(screen.getByRole("checkbox", { name: "Grande" })).toBeDisabled();
  });

  it("REQ-DS-009 escolhido mostra o check além da cor; teclado marca com espaço", async () => {
    const { user } = renderWithProviders(<Harness />, { theme: quintalTheme });
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
    await user.tab();
    await user.keyboard(" ");
    expect(screen.getByRole("checkbox", { name: /Pequeno/ })).toBeChecked();
    expect(screen.getByText("✓")).toHaveAttribute("aria-hidden", "true");
  });

  it("REQ-DS-009 erro descreve o grupo", () => {
    renderWithProviders(
      <CheckCardGroup label="Portes" options={options} value={[]} onChange={vi.fn()} error="Escolhe ao menos um." />,
      { theme: quintalTheme },
    );
    expect(screen.getByRole("group", { name: "Portes" })).toHaveAccessibleDescription("Escolhe ao menos um.");
  });
});
