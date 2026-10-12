import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { Counter } from "./Counter";
it("REQ-DS-014 contador respeita min e max sem ultrapassar limites", async () => {
  const change = vi.fn();
  function Example() {
    const [value, setValue] = useState(1);
    return (
      <Counter
        label="Capacidade"
        value={value}
        min={1}
        max={2}
        onChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  expect(screen.getByRole("button", { name: "Diminuir Capacidade" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Aumentar Capacidade" }));
  expect(change).toHaveBeenLastCalledWith(2);
  expect(screen.getByRole("status")).toHaveTextContent("2");
  expect(screen.getByRole("button", { name: "Aumentar Capacidade" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Diminuir Capacidade" }));
  expect(change).toHaveBeenLastCalledWith(1);
});
it("REQ-DS-014 contador desabilitado não altera valor", () => {
  renderWithProviders(<Counter label="Capacidade" value={1} min={0} max={2} onChange={() => {}} disabled />);
  expect(screen.getAllByRole("button").every((button) => button.hasAttribute("disabled"))).toBe(true);
});
