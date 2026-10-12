import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { SegmentedControl } from "./SegmentedControl";
const options = [
  { value: "yes", label: "Sim" },
  { value: "no", label: "Não" },
  { value: "unknown", label: "Ainda não sei", disabled: true },
];
it("REQ-DS-010 radio controlado muda por setas e clique", async () => {
  const change = vi.fn();
  function Example() {
    const [value, setValue] = useState("yes");
    return (
      <SegmentedControl
        label="Convivência"
        options={options}
        value={value}
        onChange={(next) => {
          change(next);
          setValue(next);
        }}
        fullWidth
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  expect(screen.getByRole("radiogroup", { name: "Convivência" })).toBeVisible();
  await user.tab();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: "Não" })).toBeChecked();
  expect(change).toHaveBeenLastCalledWith("no");
  await user.click(screen.getByRole("radio", { name: "Sim" }));
  expect(change).toHaveBeenLastCalledWith("yes");
  expect(screen.getByRole("radio", { name: "Ainda não sei" })).toBeDisabled();
});
it("REQ-DS-010 setas circulam, Home/End pulam indisponíveis e seleção não é anulada", async () => {
  function Example() {
    const [value, setValue] = useState("yes");
    return <SegmentedControl label="Convivência" options={options} value={value} onChange={setValue} />;
  }
  const { user } = renderWithProviders(<Example />);
  await user.tab();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("radio", { name: "Não" })).toBeChecked();
  await user.keyboard("{Home}");
  expect(screen.getByRole("radio", { name: "Sim" })).toBeChecked();
  await user.keyboard("{End}");
  expect(screen.getByRole("radio", { name: "Não" })).toBeChecked();
  await user.keyboard("{ArrowDown}");
  expect(screen.getByRole("radio", { name: "Sim" })).toBeChecked();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("radio", { name: "Não" })).toBeChecked();
  await user.keyboard("{Enter}");
  expect(screen.getByRole("radio", { name: "Não" })).toBeChecked();
});
it("REQ-DS-010 grupo desabilitado bloqueia todas as opções", () => {
  renderWithProviders(
    <SegmentedControl label="Convivência" options={options} value="yes" onChange={() => {}} disabled />,
  );
  expect(screen.getAllByRole("radio").every((radio) => radio.hasAttribute("disabled"))).toBe(true);
});
