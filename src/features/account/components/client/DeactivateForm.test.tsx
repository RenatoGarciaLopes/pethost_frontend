import { screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { DeactivateForm } from "./DeactivateForm";

const router = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => router.replace.mockReset());

function setup(role: PersonalRole = "owner") {
  return renderWithProviders(<DeactivateForm role={role} />, { theme: quintalTheme });
}
const pauseButton = () => screen.getByRole("button", { name: "Pausar minha conta" });

describe("pausar a conta", () => {
  it.each([
    ["owner", "tutor"],
    ["host", "anfitrião"],
  ] as const)("REQ-ACC-022 explica antes, para a conta de %s", (role, account) => {
    setup(role);
    expect(screen.getByRole("heading", { level: 1, name: "Pausar a conta" })).toBeInTheDocument();
    expect(
      screen.getByText(`Só a sua conta de ${account} pausa. Se você tem a outra conta, ela continua.`),
    ).toBeInTheDocument();
    expect(screen.getByText("Você sai de todos os aparelhos.")).toBeInTheDocument();
    expect(screen.getByText("Pra voltar, é só entrar com sua senha e escolher reativar.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Agora não" })).toHaveAttribute("href", role === "host" ? "/host" : "/");
  });

  it("REQ-ACC-023 o botão só liga depois de marcar 'Entendi o que acontece'", async () => {
    const { user } = setup();
    expect(pauseButton()).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: "Entendi o que acontece" }));
    expect(pauseButton()).toBeEnabled();
  });

  it.each(["owner", "host"] as const)(
    "REQ-ACC-024 pausa a conta de %s uma vez, sai do BFF, limpa o cache e vai pro login com o aviso",
    async (role) => {
      const calls: string[] = [];
      server.use(
        http.post(`*/api/${role}s/me/deactivate`, () => {
          calls.push("deactivate");
          return HttpResponse.json(apiOk({}));
        }),
        http.post("*/api/auth/sessions/logout", () => {
          calls.push("logout");
          return HttpResponse.json(apiOk({}));
        }),
      );
      const { user, queryClient } = setup(role);
      queryClient.setQueryData(["account", "user-1", "profile"], { fullName: "Camila" });

      await user.click(screen.getByRole("checkbox", { name: "Entendi o que acontece" }));
      await user.click(pauseButton());

      await waitFor(() =>
        expect(router.replace).toHaveBeenCalledExactlyOnceWith(`/login?as=${role}&aviso=conta-pausada`),
      );
      expect(calls).toEqual(["deactivate", "logout"]);
      expect(queryClient.getQueryData(["account", "user-1", "profile"])).toBeUndefined();
    },
  );

  it("REQ-ACC-024 enquanto pausa, o botão mostra 'Pausando…' com aria-busy e não envia de novo", async () => {
    let release!: () => void;
    let deactivations = 0;
    server.use(
      http.post("*/api/owners/me/deactivate", async () => {
        deactivations += 1;
        await new Promise<void>((resolve) => (release = resolve));
        return HttpResponse.json(apiOk({}));
      }),
      http.post("*/api/auth/sessions/logout", () => HttpResponse.json(apiOk({}))),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox", { name: "Entendi o que acontece" }));
    await user.click(pauseButton());

    const busy = await screen.findByRole("button", { name: "Pausando…" });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(busy).toBeDisabled();
    release();
    await waitFor(() => expect(router.replace).toHaveBeenCalledOnce());
    expect(deactivations).toBe(1);
  });

  it("REQ-ACC-025 falha mostra a frase da API e mantém a sessão", async () => {
    let loggedOut = false;
    server.use(
      http.post("*/api/owners/me/deactivate", () => HttpResponse.json(apiFail("OWNER_NOT_FOUND"), { status: 404 })),
      http.post("*/api/auth/sessions/logout", () => {
        loggedOut = true;
        return HttpResponse.json(apiOk({}));
      }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox", { name: "Entendi o que acontece" }));
    await user.click(pauseButton());

    expect(await screen.findByText("Não achamos seu perfil de tutor. Fala com o suporte.")).toBeInTheDocument();
    expect(loggedOut).toBe(false);
    expect(router.replace).not.toHaveBeenCalled();
    expect(pauseButton()).toBeEnabled();
  });

  it("REQ-ACC-028 limite de tentativas mostra a contagem e trava o envio", async () => {
    server.use(
      http.post("*/api/owners/me/deactivate", () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "30" } }),
      ),
    );
    const { user } = setup();
    await user.click(screen.getByRole("checkbox", { name: "Entendi o que acontece" }));
    await user.click(pauseButton());

    expect(await screen.findByText(/30 segundos/)).toBeInTheDocument();
    expect(pauseButton()).toBeDisabled();
  });
});
