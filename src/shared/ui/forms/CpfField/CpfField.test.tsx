import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { CpfField } from "./CpfField";

it("REQ-OREG-016 CPF com máscara, teclado numérico, sem autocomplete e só dígitos para fora", async () => {
  const change = vi.fn();
  function Example() {
    const [value, setValue] = useState("");
    return (
      <CpfField
        label="CPF"
        value={value}
        helperText="Pra identificar quem paga."
        onValueChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "CPF" });
  await user.type(input, "52998224725");
  expect(input).toHaveValue("529.982.247-25");
  expect(change).toHaveBeenLastCalledWith("52998224725");
  expect(input).toHaveAttribute("autocomplete", "off");
  expect(input).toHaveAttribute("inputmode", "numeric");
  expect(input).toHaveAccessibleDescription("Pra identificar quem paga.");
});
