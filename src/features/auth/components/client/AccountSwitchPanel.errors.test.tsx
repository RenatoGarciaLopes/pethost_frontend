import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { translateCode } from "@/shared/api/errors/translateError";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { AnnouncerProvider } from "@/shared/ui/feedback/Announcer";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { AccountSwitchPanel } from "./AccountSwitchPanel";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => {
  router.replace.mockReset();
  router.refresh.mockReset();
  server.use(
    http.get("*/api/users/me/accounts", () =>
      HttpResponse.json(
        apiOk([
          { role: "owner", isActive: true, isCurrent: true },
          { role: "host", isActive: true, isCurrent: false },
        ]),
      ),
    ),
  );
});
afterEach(() => vi.useRealTimers());
function setup(current: PersonalRole = "owner") {
  return renderWithProviders(
    <AnnouncerProvider>
      <AccountSwitchPanel userId="user-1" current={current} target={current === "owner" ? "host" : "owner"} />
    </AnnouncerProvider>,
    { theme: quintalTheme },
  );
}
const field = () => screen.getByLabelText(/^Senha da conta/);

describe("falhas e envio da troca", () => {
  it("REQ-SWITCH-005 envia uma vez, preserva a senha no payload e marca ocupado", async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const bodies: unknown[] = [];
    server.use(
      http.post("*/api/auth/sessions/switch", async ({ request }) => {
        bodies.push(await request.json());
        await pending;
        return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: "host" } }));
      }),
    );
    const { user } = setup();
    await screen.findByLabelText(/^Senha da conta/);
    await user.click(field());
    await user.paste("  senha existente  ");
    await user.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    const busy = screen.getByRole("button", { name: "Trocando…" });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    fireEvent.submit(field().closest("form")!);
    await act(async () => {});
    expect(bodies).toEqual([{ role: "host", password: "  senha existente  " }]);
    await act(async () => release());
    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
  });

  it.each(["owner", "host"] as const)(
    "REQ-SWITCH-006 troca de %s limpa cache, navega e anuncia na região viva, sem reler as contas",
    async (current) => {
      const target = current === "owner" ? "host" : "owner";
      let accountReads = 0;
      server.use(
        http.get("*/api/users/me/accounts", () => {
          accountReads += 1;
          return HttpResponse.json(
            apiOk([
              { role: "owner", isActive: true, isCurrent: true },
              { role: "host", isActive: true, isCurrent: false },
            ]),
          );
        }),
        http.post("*/api/auth/sessions/switch", () =>
          HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: target } })),
        ),
      );
      const { user, queryClient } = setup(current);
      let cacheClearedBeforeNavigation = false;
      router.replace.mockImplementation(() => {
        cacheClearedBeforeNavigation =
          queryClient.getQueryCache().getAll().length === 0 && queryClient.getMutationCache().getAll().length === 0;
      });
      queryClient.setQueryData(["account", "anterior", "pets"], ["pet"]);
      queryClient.getMutationCache().build(queryClient, { mutationKey: ["anterior"] });
      await screen.findByLabelText(/^Senha da conta/);
      await user.click(field());
      await user.paste("senha existente");
      await user.click(
        screen.getByRole("button", { name: `Entrar na conta de ${target === "host" ? "anfitrião" : "tutor"}` }),
      );
      await waitFor(() => expect(router.replace).toHaveBeenCalledExactlyOnceWith(target === "host" ? "/host" : "/"));
      expect(router.refresh).toHaveBeenCalledOnce();
      expect(cacheClearedBeforeNavigation).toBe(true);
      expect(queryClient.getQueryData(["account", "anterior", "pets"])).toBeUndefined();
      expect(queryClient.getMutationCache().getAll()).toEqual([]);
      const message = screen.getByText(`Agora você está na conta de ${target === "host" ? "anfitrião" : "tutor"}.`);
      expect(message.closest('[aria-live="polite"]')).toHaveAttribute("role", "status");
      // A conta nova não reabre a lista: a página está saindo, e um GET agora seria pedido jogado fora.
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(accountReads).toBe(1);
    },
  );

  it("REQ-SWITCH-007 404 usa frase neutra no campo vazio e focado sem inferir ausência", async () => {
    server.use(
      http.post("*/api/auth/sessions/switch", () =>
        HttpResponse.json(apiFail("AUTH_LINKED_ACCOUNT_NOT_FOUND"), { status: 404 }),
      ),
    );
    const { user } = setup();
    await screen.findByLabelText(/^Senha da conta/);
    await user.click(field());
    await user.paste("errada");
    await user.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    expect(await screen.findByText(translateCode("AUTH_LINKED_ACCOUNT_NOT_FOUND"))).toBeVisible();
    expect(field()).toHaveValue("");
    expect(field()).toHaveFocus();
    expect(field()).toHaveAttribute("aria-invalid", "true");
    expect(field()).toHaveAccessibleDescription(translateCode("AUTH_LINKED_ACCOUNT_NOT_FOUND"));
    expect(screen.queryByText(/ainda não tem conta/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("REQ-SWITCH-005 senha vazia fica no campo e não chama a API", async () => {
    const { user } = setup();
    await screen.findByLabelText(/^Senha da conta/);
    await user.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    expect(await screen.findByText("Falta a senha.")).toBeVisible();
    expect(field()).toHaveFocus();
  });

  it("REQ-SWITCH-008 VALIDATION_ERROR em password fica no campo sem apagar a senha", async () => {
    server.use(
      http.post("*/api/auth/sessions/switch", () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "Inválido", [
            { field: "password", messages: ["Confira a senha informada."], errors: [{ code: "FIELD_INVALID_FORMAT" }] },
          ]),
          { status: 400 },
        ),
      ),
    );
    const { user } = setup();
    await screen.findByLabelText(/^Senha da conta/);
    await user.click(field());
    await user.paste("senha existente");
    await user.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    expect(await screen.findByText("Esse formato não é válido. Confere o que foi digitado.")).toBeVisible();
    expect(field()).toHaveValue("senha existente");
    expect(field()).toHaveFocus();
  });

  it("REQ-SWITCH-008 falha de rede mostra frase da marca e mantém dados para tentar novamente", async () => {
    server.use(http.post("*/api/auth/sessions/switch", () => HttpResponse.error()));
    const { user } = setup();
    await screen.findByLabelText(/^Senha da conta/);
    await user.click(field());
    await user.paste("senha existente");
    await user.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    await waitFor(() => expect(screen.getByText(translateCode("NETWORK_ERROR"))).toBeVisible());
    expect(field()).toHaveValue("senha existente");
    expect(router.replace).not.toHaveBeenCalled();
  });

  it("REQ-SWITCH-008 contagem 429 bloqueia envio e libera no fim sem roubar foco a cada segundo", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
    let calls = 0;
    server.use(
      http.post("*/api/auth/sessions/switch", () => {
        calls++;
        return HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "2" } });
      }),
    );
    setup();
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(field()).toBeInTheDocument();
    });
    fireEvent.change(field(), { target: { value: "senha existente" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar na conta de anfitrião" }));
    await vi.waitFor(async () => {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(screen.getByText(/tenta de novo em 2 segundos/)).toBeInTheDocument();
    });
    const submit = screen.getByRole("button", { name: "Entrar na conta de anfitrião" });
    expect(submit).toBeDisabled();
    fireEvent.click(submit);
    expect(calls).toBe(1);
    act(() => field().focus());
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(screen.getByText(/tenta de novo em 1 segundo/)).toBeInTheDocument();
    expect(field()).toHaveFocus();
    expect(submit).toBeDisabled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(submit).toBeEnabled();
    expect(field()).toHaveValue("senha existente");
  });
});
