import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { PasswordScreen } from "./PasswordScreen";

it("REQ-PWD-013 fora da casca, a tela é o main da página", () => {
  renderWithProviders(<PasswordScreen>Conteúdo</PasswordScreen>, { theme: quintalTheme });
  expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo");
});

it("REQ-SHELL-007 dentro da casca, o main é da casca: a tela não cria outro", () => {
  renderWithProviders(<PasswordScreen inShell>Conteúdo</PasswordScreen>, { theme: quintalTheme });
  expect(screen.queryByRole("main")).not.toBeInTheDocument();
  expect(screen.getByText("Conteúdo")).toBeInTheDocument();
});
