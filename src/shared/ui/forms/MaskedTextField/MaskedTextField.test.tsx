import { screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../../test/render";
import { MaskedTextField } from "./MaskedTextField";
it("REQ-DS-014 campo mascara apresentação e devolve apenas dígitos", async () => {
  const change = vi.fn();
  function Example() {
    const [value, setValue] = useState("");
    return (
      <MaskedTextField
        label="CPF"
        mask="cpf"
        value={value}
        onValueChange={(next) => {
          change(next);
          setValue(next);
        }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "CPF" });
  await user.type(input, "12345678901");
  expect(input).toHaveValue("123.456.789-01");
  expect(change).toHaveBeenLastCalledWith("12345678901");
  await user.clear(input);
  await user.paste("abc 123.456.789-01");
  expect(input).toHaveValue("123.456.789-01");
  expect(input).toHaveAttribute("inputmode", "numeric");
});
it("REQ-DS-014 Delete, seleção e edição intermediária preservam valor e cursor", async () => {
  function Example() {
    const [value, setValue] = useState("1234");
    return (
      <MaskedTextField
        label="CPF"
        mask="cpf"
        value={value}
        onValueChange={setValue}
        slotProps={{ htmlInput: { title: "Número" } }}
      />
    );
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "CPF" }) as HTMLInputElement;
  await user.click(input);
  input.setSelectionRange(3, 3);
  await user.keyboard("{Delete}");
  expect(input).toHaveValue("123");
  input.setSelectionRange(1, 1);
  await user.keyboard("9");
  expect(input).toHaveValue("192.3");
  expect(input.selectionStart).toBe(2);
  input.setSelectionRange(0, 2);
  await user.keyboard("{Backspace}");
  expect(input).toHaveValue("23");
  input.setSelectionRange(0, 0);
  await user.keyboard("{Backspace}");
  expect(input).toHaveValue("23");
  input.setSelectionRange(2, 2);
  await user.keyboard("{Delete}");
  expect(input).toHaveValue("23");
});
it("REQ-DS-014 slots funcionais, read-only e eventos do consumidor são preservados", async () => {
  const change = vi.fn();
  const { user, rerender } = renderWithProviders(
    <MaskedTextField
      label="CPF"
      mask="cpf"
      value="1234"
      onValueChange={change}
      slotProps={{ input: { readOnly: true }, htmlInput: () => ({ title: "Número" }) }}
    />,
  );
  const input = screen.getByRole("textbox", { name: "CPF" });
  expect(input).toHaveAttribute("title", "Número");
  await user.click(input);
  await user.keyboard("{Backspace}");
  expect(change).not.toHaveBeenCalled();
  rerender(
    <MaskedTextField
      label="CPF"
      mask="cpf"
      value="1234"
      onValueChange={change}
      onKeyDown={(event) => event.preventDefault()}
    />,
  );
  await user.keyboard("{Delete}");
  expect(change).not.toHaveBeenCalled();
});
it.each([
  ["cnpj", "12345678000190", "12.345.678/0001-90"],
  ["cep", "12345678", "12345-678"],
  ["phone", "11987654321", "(11) 98765-4321"],
] as const)("REQ-DS-014 formato %s mantém valor externo e props MUI", (mask, value, display) => {
  renderWithProviders(
    <MaskedTextField label="Número" mask={mask} value={value} onValueChange={() => {}} disabled helperText="Teste" />,
  );
  expect(screen.getByRole("textbox", { name: "Número" })).toHaveValue(display);
  expect(screen.getByRole("textbox", { name: "Número" })).toBeDisabled();
});
it("REQ-DS-014 backspace junto à pontuação remove o dígito anterior", async () => {
  function Example() {
    const [value, setValue] = useState("1234");
    return <MaskedTextField label="CPF" mask="cpf" value={value} onValueChange={setValue} />;
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "CPF" }) as HTMLInputElement;
  await user.click(input);
  input.setSelectionRange(4, 4);
  await user.keyboard("{Backspace}");
  expect(input).toHaveValue("124");
});
it("REQ-OREG-016 telefone abre o teclado de telefone", () => {
  renderWithProviders(<MaskedTextField label="Celular com DDD" mask="phone" value="" onValueChange={() => {}} />);
  expect(screen.getByRole("textbox", { name: "Celular com DDD" })).toHaveAttribute("inputmode", "tel");
});
it("REQ-HVER-004 CNPJ abre o teclado de texto (aceita letras) e digita em maiúsculas", async () => {
  function Example() {
    const [value, setValue] = useState("");
    return <MaskedTextField label="CNPJ" mask="cnpj" value={value} onValueChange={setValue} />;
  }
  const { user } = renderWithProviders(<Example />);
  const input = screen.getByRole("textbox", { name: "CNPJ" });
  expect(input).toHaveAttribute("inputmode", "text");
  await user.type(input, "12abc");
  expect(input).toHaveValue("12.ABC");
});
