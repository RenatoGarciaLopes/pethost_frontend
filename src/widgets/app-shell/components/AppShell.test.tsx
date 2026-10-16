import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AccountRole } from "@/shared/auth/contracts/session";
import { accountTones } from "@/shared/theme/tokens/semantic";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { sessionUserFixture } from "@/test/fixtures/session";
import { renderWithProviders } from "@/test/render";
import { AppShell } from "./AppShell";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }), usePathname: () => "/pets" }));

function setup(role: AccountRole) {
  return renderWithProviders(
    <AppShell user={{ ...sessionUserFixture, role }}>
      <h1>Conteúdo da página</h1>
    </AppShell>,
    { theme: quintalTheme },
  );
}

describe("casca do app", () => {
  it.each(["owner", "host", "admin"] as const)("REQ-SHELL-001 cabeçalho no tom da conta de %s", (role) => {
    setup(role);
    // O tema usa variáveis CSS; o jsdom não resolve o valor, então confere a variável do tom da conta.
    expect(getComputedStyle(screen.getByRole("banner")).backgroundColor).toBe(`var(--mui-palette-account-${role})`);
    expect(accountTones[role]).toMatch(/^#/);
  });

  it.each([
    ["owner", "/"],
    ["host", "/host"],
    ["admin", "/admin/host-applications"],
  ] as const)("REQ-SHELL-016 o logo da conta de %s leva à casa dela", (role, home) => {
    setup(role);
    expect(within(screen.getByRole("banner")).getByRole("link", { name: "PetHost" })).toHaveAttribute("href", home);
  });

  it("REQ-SHELL-007 'Pular para o conteúdo' é o primeiro foco e aponta para o main da casca", async () => {
    const { user } = setup("owner");
    await user.tab();
    const skip = screen.getByRole("link", { name: "Pular para o conteúdo" });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute("href", "#conteudo");
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo");
    expect(within(main).getByRole("heading", { name: "Conteúdo da página" })).toBeInTheDocument();
  });

  it("REQ-SHELL-003 menu da conta com o nome", () => {
    setup("host");
    expect(
      screen.getByRole("button", { name: new RegExp(`Menu da conta de ${sessionUserFixture.fullName}$`) }),
    ).toBeInTheDocument();
  });
});

describe("atalhos na casca", () => {
  it("REQ-SHELL-002 REQ-HVER-001 REQ-HPETS-010 tutor tem Meus pets; anfitrião tem Minha verificação e Pets da casa; admin tem a fila de verificação", () => {
    const { unmount } = setup("owner");
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    unmount();
    const host = setup("host");
    expect(
      within(screen.getByRole("navigation", { name: "Navegação principal" })).getByRole("link", {
        name: "Minha verificação",
      }),
    ).toHaveAttribute("href", "/host/application");
    expect(
      within(screen.getByRole("navigation", { name: "Navegação principal" })).getByRole("link", {
        name: "Pets da casa",
      }),
    ).toHaveAttribute("href", "/pets");
    host.unmount();
    setup("admin");
    expect(
      within(screen.getByRole("navigation", { name: "Navegação principal" })).getByRole("link", {
        name: "Fila de verificação",
      }),
    ).toHaveAttribute("href", "/admin/host-applications");
  });
  it("REQ-AQUEUE-001 admin tem atalho para a fila de verificação", () => {
    setup("admin");
    expect(screen.getByRole("link", { name: "Fila de verificação" })).toHaveAttribute(
      "href",
      "/admin/host-applications",
    );
  });
  it("REQ-AACC-001 admin tem atalho para as contas", () => {
    setup("admin");
    expect(screen.getByRole("link", { name: "Contas" })).toHaveAttribute("href", "/admin/users");
  });
});
