import { screen } from "@testing-library/react";
import { TextField } from "@mui/material";
import { expect, it } from "vitest";
import { renderWithProviders } from "../../../test/render";
import { quintalTheme } from "../createQuintalTheme";

it.each([false, true])("campo focado não ganha contorno externo, inclusive com erro=%s", async (error) => {
  const { user } = renderWithProviders(<TextField label="Nome" error={error} />, { theme: quintalTheme });
  const input = screen.getByRole("textbox", { name: "Nome" });
  await user.click(input);
  expect(input).toHaveFocus();
  const field = input.closest(".MuiOutlinedInput-root")!;
  expect(field).toHaveClass("Mui-focused");
  expect(getComputedStyle(field).outline).toBe("");
  expect(getComputedStyle(field.querySelector("fieldset")!).borderColor).toBe(
    error ? "rgb(168, 50, 62)" : "rgb(31, 26, 23)",
  );
  await user.type(input, "Renato");
  expect(input).toHaveValue("Renato");
});
