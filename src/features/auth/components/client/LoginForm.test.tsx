import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GENERIC_ERROR_MESSAGE, translateCode } from "@/shared/api/errors/translateError";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { authCopy } from "../../lib/authCopy";
import { LoginForm } from "./LoginForm";

const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("@/shared/api/client/bffClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/api/client/bffClient")>();
  return { ...actual, bffClient: actual.createBffClient({ baseUrl: "http://api.test/api" }) };
});
beforeEach(() => {
  router.replace.mockClear();
  router.refresh.mockClear();
});
const endpoint = "http://api.test/api/auth/sessions/login";

describe("LoginForm", { timeout: 15000 }, () => {
  function setup(initialRole: "owner" | "host" | "admin" = "owner") {
    return renderWithProviders(
      <LoginForm variant={initialRole === "admin" ? "admin" : "account"} initialRole={initialRole} next={null} />,
      { theme: quintalTheme },
    );
  }
  async function fill(user: ReturnType<typeof setup>["user"]) {
    await user.click(screen.getByLabelText(/^E-mail/));
    await user.paste("TESTE@exemplo.com");
    await user.click(screen.getByLabelText(/^Senha/));
    await user.paste("senha");
  }

  it("REQ-AUTH-001/002/013 troca papel, ajuda e links", async () => {
    const { user } = setup();
    expect(screen.getByRole("radio", { name: "Sou tutor" })).toBeChecked();
    await waitFor(() => expect(screen.getByText(authCopy.roles.owner.help)).toBeVisible());
    await user.click(screen.getByRole("radio", { name: "Sou anfitrião" }));
    expect(screen.getByRole("radio", { name: "Sou anfitrião" })).toBeChecked();
    expect(screen.getByText(authCopy.roles.host.help)).toBeVisible();
    expect(screen.getByRole("link", { name: "Criar conta" })).toHaveAttribute("href", "/register/host");
    expect(screen.getByRole("link", { name: "Esqueci a senha" })).toHaveAttribute("href", "/forgot-password?as=host");
  });
  it("REQ-AUTH-001 respeita anfitrião inicial", () => {
    setup("host");
    expect(screen.getByRole("radio", { name: "Sou anfitrião" })).toBeChecked();
  });
  it("REQ-AUTH-003 valida no blur e no envio sem HTTP", async () => {
    const { user } = setup();
    await user.click(screen.getByLabelText(/^E-mail/));
    await user.tab();
    await waitFor(() => expect(screen.getByText(authCopy.fieldErrors.emailMissing)).toBeVisible());
    await user.type(screen.getByLabelText(/^E-mail/), "incompleto");
    await user.tab();
    await waitFor(() => expect(screen.getByText(authCopy.fieldErrors.emailInvalid)).toBeVisible());
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(screen.getByText(authCopy.fieldErrors.passwordMissing)).toBeVisible());
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("REQ-AUTH-004 bloqueia envio duplo, normaliza email e marca atributos da porta", async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => {
      complete = resolve;
    });
    const requests: unknown[] = [];
    server.use(
      http.post(endpoint, async ({ request }) => {
        requests.push(await request.json());
        await pending;
        return HttpResponse.json(apiOk({ user: sessionUserFixture }));
      }),
    );
    const { user, container } = setup();
    await fill(user);
    const submit = screen.getByRole("button", { name: "Entrar" });
    expect(container.querySelector("form")).toHaveAttribute("data-door-target");
    expect(submit).toHaveAttribute("data-door-warm");
    await user.click(submit);
    await waitFor(() => expect(submit).toBeDisabled());
    expect(submit).toHaveAttribute("aria-busy", "true");
    fireEvent.click(submit);
    await waitFor(() => expect(requests).toEqual([{ email: "teste@exemplo.com", password: "senha", role: "owner" }]));
    complete();
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/"));
  });
  it("REQ-AUTH-007 conta errada anuncia erro, recebe foco, mantém email e limpa senha", async () => {
    server.use(http.post(endpoint, () => HttpResponse.json(apiFail("AUTH_INVALID_CREDENTIALS"), { status: 401 })));
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(translateCode("AUTH_INVALID_CREDENTIALS"));
    await waitFor(() => expect(alert).toHaveFocus());
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue("TESTE@exemplo.com");
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("");
    await user.click(screen.getByRole("radio", { name: "Sou anfitrião" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument(), { timeout: 3000 });
  });
  it.each(["owner", "host"] as const)("REQ-AUTH-008 reativa %s com credenciais do último envio", async (role) => {
    let received: unknown;
    server.use(
      http.post(endpoint, () => HttpResponse.json(apiFail("AUTH_ACCOUNT_DEACTIVATED"), { status: 403 })),
      http.post(`http://api.test/api/${role === "owner" ? "owners" : "hosts"}/reactivate`, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role } }));
      }),
    );
    const { user } = setup(role);
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(screen.getByText(translateCode("AUTH_ACCOUNT_DEACTIVATED"))).toBeVisible());
    await user.clear(screen.getByLabelText(/^E-mail/));
    await user.paste("outro@exemplo.com");
    await user.clear(screen.getByLabelText(/^Senha/));
    await user.paste("outra");
    await user.click(screen.getByRole("button", { name: "Reativar minha conta" }));
    await waitFor(() => expect(router.refresh).toHaveBeenCalledOnce());
    expect(received).toEqual({ email: "teste@exemplo.com", password: "senha", role });
  });
  it("REQ-AUTH-008 bloqueia reativação duplicada e apresenta falha da reativação", async () => {
    let complete!: () => void;
    const pending = new Promise<void>((resolve) => {
      complete = resolve;
    });
    let requests = 0;
    server.use(
      http.post(endpoint, () => HttpResponse.json(apiFail("AUTH_ACCOUNT_DEACTIVATED"), { status: 403 })),
      http.post("http://api.test/api/owners/reactivate", async () => {
        requests += 1;
        await pending;
        return HttpResponse.json(apiFail("AUTH_INVALID_CREDENTIALS"), { status: 401 });
      }),
    );
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await user.click(await screen.findByRole("button", { name: "Reativar minha conta" }));
    const action = await screen.findByRole("button", { name: "Reativando…" });
    expect(action).toBeDisabled();
    expect(action).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "Entrando…" })).toBeDisabled();
    fireEvent.click(action);
    await waitFor(() => expect(requests).toBe(1));
    complete();
    expect(await screen.findByRole("alert")).toHaveTextContent(translateCode("AUTH_INVALID_CREDENTIALS"));
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("");
    expect(router.replace).not.toHaveBeenCalled();
  });
  it("REQ-AUTH-009 suspensão mostra frase sem link enquanto canal está pendente", async () => {
    server.use(http.post(endpoint, () => HttpResponse.json(apiFail("AUTH_ACCOUNT_SUSPENDED"), { status: 403 })));
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(translateCode("AUTH_ACCOUNT_SUSPENDED"));
    expect(within(alert).queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reativar minha conta" })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("");
  });
  it("REQ-AUTH-010 conta Retry-After e libera envio ao terminar", async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "2" } }),
      ),
    );
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("timer")).toHaveTextContent(authCopy.countdown(2));
    expect(screen.getByRole("button", { name: "Entrar" })).toBeDisabled();
    await waitFor(() => expect(screen.getByRole("timer")).toHaveTextContent(authCopy.countdown(1)), { timeout: 2000 });
    await waitFor(() => expect(screen.queryByRole("timer")).not.toBeInTheDocument(), { timeout: 2000 });
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });
  it("REQ-AUTH-010 usa 30 segundos quando Retry-After está ausente", async () => {
    server.use(http.post(endpoint, () => HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429 })));
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("timer")).toHaveTextContent(authCopy.countdown(30));
  });
  it.each(["network", "UNKNOWN"])("REQ-AUTH-011 erro %s mantém dados para tentar de novo", async (kind) => {
    server.use(
      http.post(endpoint, () =>
        kind === "network" ? HttpResponse.error() : HttpResponse.json(apiFail(kind), { status: 500 }),
      ),
    );
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      kind === "network" ? translateCode("NETWORK_ERROR") : GENERIC_ERROR_MESSAGE,
    );
    expect(screen.getByLabelText(/^Senha/)).toHaveValue("senha");
    expect(screen.getByLabelText(/^E-mail/)).toHaveValue("TESTE@exemplo.com");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeEnabled();
  });
  it("REQ-AUTH-003 associa validação da API ao campo", async () => {
    server.use(
      http.post(endpoint, () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "x", [
            { field: "email", messages: ["Email recusado"], errors: [{ code: "FIELD_INVALID_FORMAT" }] },
          ]),
          {
            status: 400,
          },
        ),
      ),
    );
    const { user } = setup();
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByText("Esse formato não é válido. Confere o que foi digitado.")).toBeVisible();
    expect(screen.getByLabelText(/^E-mail/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
  it("REQ-AUTH-015 admin fixa papel e omite cadastro e escolha", async () => {
    let received: unknown;
    server.use(
      http.post(endpoint, async ({ request }) => {
        received = await request.json();
        return HttpResponse.json(apiOk({ user: { ...sessionUserFixture, role: "admin" } }));
      }),
    );
    const { user } = setup("admin");
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Criar conta" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Esqueci a senha" })).toHaveAttribute("href", "/forgot-password?as=admin");
    await fill(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/admin/host-applications"));
    expect(received).toEqual({ email: "teste@exemplo.com", password: "senha", role: "admin" });
  });
});
