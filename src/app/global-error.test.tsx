import { render, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import GlobalError from "./global-error";
afterEach(() => vi.unstubAllGlobals());
it("REQ-SHELL-015 documento funciona sem tema ou providers e oferece recarregar", async () => {
  const reload = vi.fn();
  vi.stubGlobal("location", { reload });
  render(<GlobalError />, { container: document });
  const page = within(document.body);
  expect(document.documentElement).toHaveAttribute("lang", "pt-BR");
  expect(page.getByRole("heading", { level: 1, name: "Deu um problema do nosso lado." })).toBeVisible();
  expect(page.getByRole("alert")).toHaveTextContent("Recarrega a página pra tentar de novo.");
  expect(document.body.style.fontFamily).toContain("sans-serif");
  await userEvent.setup().click(page.getByRole("button", { name: "Recarregar" }));
  expect(reload).toHaveBeenCalledOnce();
});
