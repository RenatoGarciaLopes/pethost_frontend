import { act, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { renderWithProviders } from "@/test/render";
import { GrassFooter } from "./GrassFooter";

const { contactChannels } = vi.hoisted(() => ({ contactChannels: [] as { label: string; href: string }[] }));
vi.mock("@/shared/config/contact", () => ({ CONTACT_CHANNELS: contactChannels }));

function stubMotion(reduced: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduced && query.includes("reduce"),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

/** Posiciona o rodapé (altura 344) com o topo em `top` px numa janela de 800 px. */
function placeFooter(top: number) {
  vi.stubGlobal("innerHeight", 800);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top, height: 344 } as DOMRect);
}
function scrollFrame() {
  window.dispatchEvent(new Event("scroll"));
  act(() => vi.advanceTimersToNextFrame());
}

beforeEach(() => vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame"] }));
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  contactChannels.length = 0;
});

it("093 expõe um landmark com destinos existentes e direitos do ano corrente", () => {
  stubMotion(false);
  placeFooter(900);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByRole("contentinfo");
  expect(footer).not.toHaveAttribute("aria-hidden");
  expect(within(footer).getByText("pethost", { exact: true })).toBeVisible();
  const nav = within(within(footer).getByRole("navigation", { name: "Navegue" }));
  for (const [name, href] of [
    ["Início / Buscar", "/"],
    ["Como funciona", "/#como-funciona"],
    ["Abrir meu cantinho", "/register/host"],
    ["Entrar", "/login"],
    ["Criar conta", "/register/owner"],
  ])
    expect(nav.getByRole("link", { name })).toHaveAttribute("href", href);
  expect(
    within(footer).getByText(`© ${new Date().getFullYear()} PetHost. Todos os direitos reservados.`),
  ).toBeVisible();
  expect(within(footer).getAllByRole("link")).toHaveLength(5);
  expect(within(footer).queryByRole("heading", { name: "Fale com a gente" })).not.toBeInTheDocument();
});

it.each([
  ["owner", "Minhas estadias", "/owner/bookings"],
  ["host", "Painel", "/host"],
] as const)("093 conta %s recebe seu atalho em vez de entrar e criar conta", (accountRole, name, href) => {
  stubMotion(true);
  renderWithProviders(<GrassFooter accountRole={accountRole} />, { theme: quintalTheme });
  const footer = within(screen.getByRole("contentinfo"));
  expect(footer.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  expect(footer.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
  expect(footer.getByRole("link", { name })).toHaveAttribute("href", href);
});

it("093 conta admin na home pública não recebe links de autenticação ou atalhos pessoais", () => {
  stubMotion(true);
  renderWithProviders(<GrassFooter accountRole="admin" />, { theme: quintalTheme });
  const footer = within(screen.getByRole("contentinfo"));
  expect(footer.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
  expect(footer.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
  expect(footer.queryByRole("link", { name: "Minhas estadias" })).not.toBeInTheDocument();
  expect(footer.queryByRole("link", { name: "Painel" })).not.toBeInTheDocument();
  expect(footer.getAllByRole("link")).toHaveLength(3);
});

it("093 lê os canais da configuração e mostra a coluna de contato quando há dados", () => {
  stubMotion(true);
  contactChannels.push(
    { label: "Contato de teste", href: "mailto:footer@example.test" },
    { label: "Telefone de teste", href: "tel:+5500000000000" },
    { label: "Rede de teste", href: "https://example.test/pethost" },
  );
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  for (const { label, href } of contactChannels)
    expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
  expect(screen.getByRole("heading", { name: "Fale com a gente" })).toBeVisible();
});

it("REQ-UIC-011 a terra escurece conforme o rodapé sobe na tela e volta ao subir", () => {
  stubMotion(false);
  placeFooter(900);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByTestId("grass-footer");
  expect(footer.style.getPropertyValue("--descida")).toBe("0.000");
  placeFooter(628);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("0.500");
  placeFooter(456);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("1.000");
  placeFooter(1200);
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("0.000");
});

it("REQ-UIC-011 com movimento reduzido não ouve a rolagem e fica no degradê estático", () => {
  stubMotion(true);
  placeFooter(456);
  renderWithProviders(<GrassFooter />, { theme: quintalTheme });
  const footer = screen.getByTestId("grass-footer");
  scrollFrame();
  expect(footer.style.getPropertyValue("--descida")).toBe("");
});
