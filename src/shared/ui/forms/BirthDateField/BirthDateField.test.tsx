import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { BirthDateField } from "./BirthDateField";

it("REQ-OREG-016 nascimento digitado como dd/mm/aaaa, com autocomplete bday e só dígitos para fora", async () => {
  const change = vi.fn();
  const blur = vi.fn();
  function Example() {
    const [value, setValue] = useState("");
    return (
      <BirthDateField
        label="Quando você nasceu?"
        value={value}
        onBlur={blur}
        onValueChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "Quando você nasceu?" });
  expect(input).toHaveAttribute("placeholder", "dd/mm/aaaa");
  await user.type(input, "03051990");
  expect(input).toHaveValue("03/05/1990");
  expect(change).toHaveBeenLastCalledWith("03051990");
  expect(input).toHaveAttribute("autocomplete", "bday");
  expect(input).toHaveAttribute("inputmode", "numeric");
  await user.tab();
  expect(blur).toHaveBeenCalled();
});

it("o placeholder pode ser trocado por quem usa", () => {
  renderWithProviders(
    <BirthDateField
      label="Nascimento"
      value=""
      onValueChange={() => {}}
      slotProps={{ htmlInput: { placeholder: "x" } }}
    />,
  );
  expect(screen.getByRole("textbox", { name: "Nascimento" })).toHaveAttribute("placeholder", "x");
});
