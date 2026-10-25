import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { ChoiceCardGroup } from "./ChoiceCardGroup";
const options = [
  { value: "dog", label: "Cachorro", description: "Companhia" },
  { value: "cat", label: "Gato", description: "Atenção: tem gato em casa" },
  { value: "other", label: "Outro", disabled: true },
];
it("REQ-DS-009 cards preservam avisos e seleção por teclado e clique", async () => {
  const change = vi.fn();
  function Example() {
    const [value, setValue] = useState("dog");
    return (
      <ChoiceCardGroup
        label="Espécie"
        options={options}
        value={value}
        onChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  expect(screen.getByRole("radiogroup", { name: "Espécie" })).toBeVisible();
  await user.tab();
  await user.keyboard("{ArrowRight}");
  expect(screen.getByRole("radio", { name: /Gato.*Atenção/ })).toBeChecked();
  expect(change).toHaveBeenLastCalledWith("cat");
  expect(screen.getByRole("radio", { name: "Outro" })).toBeDisabled();
  await user.click(screen.getByRole("radio", { name: /Cachorro/ }));
  expect(change).toHaveBeenLastCalledWith("dog");
});

it("section label remains the accessible group name", () => {
  renderWithProviders(
    <ChoiceCardGroup label="Plano" labelVariant="section" options={options} value="dog" onChange={() => {}} />,
  );
  expect(screen.getByRole("heading", { name: "Plano", level: 2 })).toBeVisible();
  expect(screen.getByRole("radiogroup", { name: "Plano" })).toBeVisible();
});
