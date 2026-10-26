import { screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { LoginScreen } from "./LoginScreen";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
it("REQ-AUTH-016 compõe entrada pessoal com formulário, cena decorativa e garantias", () => {
  const { container } = renderWithProviders(<LoginScreen variant="account" initialRole="host" next="/pets" />, {
    theme: quintalTheme,
  });
  const main = screen.getByRole("main");
  expect(main).toHaveAttribute("id", "conteudo");
  expect(within(main).getByRole("heading", { level: 1 })).toHaveTextContent("Entra que a porta tá aberta");
  expect(screen.getByRole("radio", { name: "Sou anfitrião" })).toBeChecked();
  const guarantees = within(screen.getByRole("list", { name: "Garantias da PetHost" })).getAllByRole("listitem");
  expect(guarantees.map((item) => item.textContent)).toEqual([
    "Conversa antes de fechar",
    "Foto todo dia",
    "Pagamento guardado",
  ]);
  expect(screen.queryByText(/conta está pausada/)).not.toBeInTheDocument();
  expect(container.querySelector('svg[viewBox="0 0 360 300"]')!.parentElement).toHaveAttribute("aria-hidden", "true");
});
it("REQ-AUTH-015 entrada admin mostra marca, sem cena, garantias ou cadastro", () => {
  const { container } = renderWithProviders(<LoginScreen variant="admin" initialRole="admin" next={null} />, {
    theme: quintalTheme,
  });
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Entrada da equipe");
  expect(screen.getByRole("img", { name: "PetHost" })).toBeInTheDocument();
  expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
  expect(container.querySelector('svg[viewBox="0 0 360 300"]')).not.toBeInTheDocument();
  expect(screen.queryByText("Foto todo dia")).not.toBeInTheDocument();
});
it("REQ-ACC-024 aviso de conta pausada aparece junto do formulário", () => {
  renderWithProviders(<LoginScreen variant="account" initialRole="owner" next={null} notice="conta-pausada" />, {
    theme: quintalTheme,
  });
  expect(screen.getByText("Sua conta está pausada. Quando quiser voltar, é só entrar.")).toBeInTheDocument();
});
