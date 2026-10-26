import { act, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AccountSwitchPanel } from "./AccountSwitchPanel";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});

function setup(current: PersonalRole = "owner") {
  const target = current === "owner" ? "host" : "owner";
  return renderWithProviders(
    <AnnouncerProvider>
      <AccountSwitchPanel userId="user-1" current={current} target={target} />
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
}

describe("AccountSwitchPanel", () => {
  it.each(["owner", "host"] as const)(
    "REQ-SWITCH-002/004/011 direção da conta %s tem textos e links próprios",
    async (current) => {
      server.use(
        http.get("*/api/users/me/accounts", () =>
          HttpResponse.json(
            apiOk([
              { role: "owner", isActive: true, isCurrent: current === "owner" },
              { role: "host", isActive: true, isCurrent: current === "host" },
            ]),
          ),
        ),
      );
      setup(current);
      const target = current === "owner" ? "host" : "owner";
      const name = target === "host" ? "anfitrião" : "tutor";
      expect(await screen.findByLabelText(new RegExp(`^Senha da conta de ${name}`))).toBeVisible();
      expect(screen.getByText(`Você está na conta de ${current === "owner" ? "tutor" : "anfitrião"}`)).toBeVisible();
      expect(screen.getByRole("button", { name: `Entrar na conta de ${name}` })).toBeEnabled();
      expect(screen.getByText(`Cada conta tem a própria senha. Use a da conta de ${name}.`)).toBeVisible();
      expect(screen.getByRole("link", { name: "Esqueci essa senha" })).toHaveAttribute(
        "href",
        `/forgot-password?as=${target}`,
      );
      expect(screen.getByRole("link", { name: "Agora não" })).toHaveAttribute(
        "href",
        current === "owner" ? "/" : "/host",
      );
    },
  );

  it.each(["owner", "host"] as const)(
    "REQ-SWITCH-003 ausência da outra conta de %s oferece cadastro sem senha",
    async (current) => {
      server.use(
        http.get("*/api/users/me/accounts", () =>
          HttpResponse.json(apiOk([{ role: current, isActive: true, isCurrent: true }])),
        ),
      );
      setup(current);
      const target = current === "owner" ? "host" : "owner";
      const name = target === "host" ? "anfitrião" : "tutor";
      expect(await screen.findByText(`Você ainda não tem conta de ${name}.`)).toBeVisible();
      expect(screen.getByRole("link", { name: `Criar conta de ${name}` })).toHaveAttribute(
        "href",
        `/register/${target}`,
      );
      expect(screen.queryByLabelText(/^Senha da conta/)).not.toBeInTheDocument();
    },
  );

  it.each(["owner", "host"] as const)(
    "REQ-SWITCH-003 outra conta de %s pausada oferece o login correto",
    async (current) => {
      const target = current === "owner" ? "host" : "owner";
      server.use(
        http.get("*/api/users/me/accounts", () =>
          HttpResponse.json(apiOk([{ role: target, isActive: false, isCurrent: false }])),
        ),
      );
      setup(current);
      expect(
        await screen.findByText(`Sua conta de ${target === "host" ? "anfitrião" : "tutor"} está pausada.`),
      ).toBeVisible();
      expect(screen.getByRole("link", { name: "Entrar pra reativar" })).toHaveAttribute("href", `/login?as=${target}`);
      expect(screen.queryByLabelText(/^Senha da conta/)).not.toBeInTheDocument();
    },
  );

  it("REQ-SWITCH-013 com next, o Agora não e a troca voltam para onde a pessoa estava; next inseguro cai na casa", async () => {
    const next = "/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c?from=2026-12-20&to=2026-12-25";
    server.use(
      http.get("*/api/users/me/accounts", () =>
        HttpResponse.json(
          apiOk([
            { role: "owner", isActive: true, isCurrent: false },
            { role: "host", isActive: true, isCurrent: true },
          ]),
        ),
      ),
      http.post("*/api/auth/sessions/switch", () =>
        HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: "owner" } })),
      ),
    );
    const panel = (value: string) => (
      <AnnouncerProvider>
        <AccountSwitchPanel userId="user-1" current="host" target="owner" next={value} />
      </AnnouncerProvider>
    );
    const { user, rerender } = renderWithProviders(panel("//evil.example"), { theme: quintalTheme });
    expect(await screen.findByRole("link", { name: "Agora não" })).toHaveAttribute("href", "/host");
    rerender(panel(next));
    expect(screen.getByRole("link", { name: "Agora não" })).toHaveAttribute("href", next);
    await user.click(screen.getByLabelText(/^Senha da conta/));
    await user.paste("senha existente");
    await user.click(screen.getByRole("button", { name: "Entrar na conta de tutor" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith(next));
  });

  it("REQ-SWITCH-003 anuncia carregamento até o GET terminar", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    server.use(
      http.get("*/api/users/me/accounts", async () => {
        await pending;
        return HttpResponse.json(apiOk([]));
      }),
    );
    setup();
    expect(screen.getByText("Buscando suas contas")).toBeVisible();
    expect(screen.queryByLabelText(/^Senha da conta/)).not.toBeInTheDocument();
    await act(async () => release());
    await screen.findByText("Você ainda não tem conta de anfitrião.");
    expect(screen.queryByText("Buscando suas contas")).not.toBeInTheDocument();
  });

  it("REQ-SWITCH-003 erro oferece Tentar de novo e refaz o GET", async () => {
    let calls = 0;
    server.use(
      http.get("*/api/users/me/accounts", () => {
        calls++;
        return calls === 1
          ? HttpResponse.json(apiFail("UNEXPECTED_ERROR"), { status: 503 })
          : HttpResponse.json(apiOk([{ role: "host", isActive: true, isCurrent: false }]));
      }),
    );
    const { user } = setup();
    expect(await screen.findByText("Não deu pra ver suas contas agora.")).toBeVisible();
    expect(screen.queryByRole("link", { name: /Criar conta/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Tentar de novo" }));
    await waitFor(() => expect(screen.getByLabelText(/^Senha da conta/)).toBeVisible());
    expect(calls).toBe(2);
  });
});
