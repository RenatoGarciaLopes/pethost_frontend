import { screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import RouteError from "./error";
it("REQ-SHELL-013 erro inesperado mostra voz da marca, nunca detalhes, e reset funciona", async () => {
  const error = new Error("SQL interno que não deve aparecer");
  error.stack = "pilha privada";
  const reset = vi.fn();
  const { user } = renderWithProviders(<RouteError error={error} reset={reset} />, { theme: quintalTheme });
  expect(screen.getByRole("alert")).toHaveTextContent("Deu um problema do nosso lado.");
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  expect(screen.queryByText(/SQL interno|pilha privada/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
  expect(reset).toHaveBeenCalledOnce();
});
it.each([400, 500, 503])("REQ-SHELL-013 traceId do ApiError só aparece para 5xx, status %s", (status) => {
  const error = new ApiError({
    status,
    code: "UNEXPECTED_ERROR",
    message: "Mensagem técnica",
    traceId: "trace-sintetico",
  });
  renderWithProviders(<RouteError error={error} reset={() => {}} />, { theme: quintalTheme });
  if (status >= 500) expect(screen.getByText("trace-sintetico")).toBeVisible();
  else expect(screen.queryByText("trace-sintetico")).not.toBeInTheDocument();
  expect(screen.queryByText("Mensagem técnica")).not.toBeInTheDocument();
});
it("REQ-SHELL-013 digest de erro serializado não vira traceId nem aparece como mensagem", () => {
  renderWithProviders(
    <RouteError error={{ message: "segredo interno", digest: "digest-privado" }} reset={() => {}} />,
    { theme: quintalTheme },
  );
  expect(screen.queryByText(/digest-privado|segredo interno/)).not.toBeInTheDocument();
  expect(screen.getByRole("alert")).toBeInTheDocument();
});
