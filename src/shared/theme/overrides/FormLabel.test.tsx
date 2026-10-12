import { screen } from "@testing-library/react";
import { TextField } from "@mui/material";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { quintalTheme } from "../createQuintalTheme";

const TINTA = "rgb(31, 26, 23)";

it("REQ-DS-005 rótulo fica em tinta com foco (coral não tem contraste de texto)", async () => {
  const { user } = renderWithProviders(<TextField label="E-mail" />, { theme: quintalTheme });
  await user.click(screen.getByRole("textbox", { name: "E-mail" }));
  const label = document.querySelector("label")!;
  expect(label).toHaveClass("Mui-focused");
  expect(getComputedStyle(label).color).toBe(TINTA);
});

it("REQ-DS-005 obrigatório sem asterisco visível, mas anunciado pelo campo", () => {
  renderWithProviders(<TextField label="Seu nome completo" required />, { theme: quintalTheme });
  const asterisk = document.querySelector(".MuiFormLabel-asterisk");
  expect(asterisk).not.toBeNull();
  expect(getComputedStyle(asterisk!).display).toBe("none");
  expect(screen.getByRole("textbox", { name: /Seu nome completo/ })).toBeRequired();
});
