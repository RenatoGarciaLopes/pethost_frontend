import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { RegisterChoice } from "./RegisterChoice";

it("074 cartões mostram o papel atual e delegam a troca ao formulário", async () => {
  const onChoose = vi.fn();
  const { user } = renderWithProviders(<RegisterChoice role="owner" onChoose={onChoose} />, { theme: quintalTheme });
  expect(screen.getByRole("button", { name: /Tenho pet e vou viajar/ })).toHaveAttribute("aria-pressed", "true");
  const host = screen.getByRole("button", { name: /Quero receber pets em casa/ });
  expect(host).toHaveAttribute("aria-pressed", "false");
  await user.click(host);
  expect(onChoose).toHaveBeenCalledWith("host");
});
