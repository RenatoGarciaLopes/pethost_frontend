import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { ToggleRow } from "./ToggleRow";
it("REQ-DS-014 switch revela conteúdo com rótulo e controle ARIA", async () => {
  function Example() {
    const [checked, setChecked] = useState(false);
    return (
      <ToggleRow label="Tem observação?" checked={checked} onChange={setChecked}>
        <input aria-label="Observação" />
      </ToggleRow>
    );
  }
  const { user } = renderWithProviders(<Example />);
  const toggle = screen.getByRole("switch", { name: "Tem observação?" });
  expect(toggle).not.toBeChecked();
  expect(screen.queryByRole("textbox", { name: "Observação" })).not.toBeInTheDocument();
  await user.click(toggle);
  expect(toggle).toBeChecked();
  expect(screen.getByRole("textbox", { name: "Observação" })).toBeVisible();
  expect(toggle).toHaveAttribute("aria-controls");
  await user.click(toggle);
  expect(screen.queryByRole("textbox", { name: "Observação" })).not.toBeInTheDocument();
});
it("REQ-DS-008 preferência reduzida revela conteúdo sem animação", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
  renderWithProviders(
    <ToggleRow label="Observação?" checked onChange={() => {}}>
      <span>Detalhes</span>
    </ToggleRow>,
  );
  expect(getComputedStyle(screen.getByText("Detalhes").parentElement!).animation).toBe("none");
  vi.unstubAllGlobals();
});
