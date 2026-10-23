import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { registrationCopy } from "../../lib/registrationCopy";
import { RegistrationWizard } from "./RegistrationWizard";
import {
  ACCOUNT_BODY,
  continueButton,
  field,
  fillPerson,
  heading,
  reachSubmit,
  submitButton,
  viaCepHandler,
} from "./registrationWizardTestHelpers";

const router = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

/**
 * Cadastro de anfitrião (spec 012): o mesmo wizard da 011 na variante `host`.
 * REQ-HREG-001, 003, 004, 005, 006 e 007.
 */
const { fields, fieldErrors, actions, steps } = registrationCopy;
const HOST_REGISTER_URL = "*/api/users/register";
const HOST = { withCpf: false };
const hostUser = { ...sessionUserFixture, role: "host" };

beforeEach(() => {
  vi.clearAllMocks();
  server.use(
    viaCepHandler,
    // O anfitrião nunca pode cair na rota do tutor.
    http.post("*/api/owners/register", () => HttpResponse.json(apiFail("NOT_FOUND"), { status: 404 })),
  );
});

function renderWizard(next: string | null = null) {
  return renderWithProviders(<RegistrationWizard role="host" next={next} />, {
    theme: quintalTheme,
  });
}

// Formulário inteiro preenchido no jsdom: cada caso leva alguns segundos.
vi.setConfig({ testTimeout: 30_000 });

describe("RegistrationWizard anfitrião: passos", () => {
  it("REQ-HREG-001 passo 1 sem CPF, com a ajuda do topo", () => {
    renderWizard();
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(screen.getByText("O CPF e os documentos ficam pra verificação, no próximo passo.")).toBeInTheDocument();
    expect(screen.queryByLabelText(new RegExp(`^${fields.cpf}`))).not.toBeInTheDocument();
    expect(screen.queryByText(fields.cpfHelp)).not.toBeInTheDocument();
  });

  it("REQ-HREG-003 a senha explica que é só da conta de anfitrião", () => {
    renderWizard();
    expect(field(fields.password)).toHaveAccessibleDescription(
      "Se você também tem conta de tutor, esta senha é só da conta de anfitrião.",
    );
    expect(field(fields.birthDate)).toHaveAccessibleDescription(fields.birthDateHelp);
  });

  it("REQ-HREG-002 Continuar valida o passo 1 sem cobrar CPF", async () => {
    const { user } = renderWizard();
    await user.click(continueButton());
    expect(await screen.findByText(fieldErrors.fullNameMissing)).toBeInTheDocument();
    expect(screen.queryByText(fieldErrors.cpfMissing)).not.toBeInTheDocument();
    await waitFor(() => expect(field(fields.fullName)).toHaveFocus());
  });

  it("REQ-HREG-001 passo 1 válido sem CPF vai ao endereço, com o porquê do anfitrião", async () => {
    const { user } = renderWizard();
    await fillPerson(user, HOST);
    await user.click(continueButton());
    const title = await screen.findByRole("heading", { level: 1, name: steps.address.title });
    await waitFor(() => expect(title).toHaveFocus());
    expect(screen.getByText(steps.address.hostWhy)).toBeInTheDocument();
    expect(screen.queryByText(steps.address.why)).not.toBeInTheDocument();
  });
});

describe("RegistrationWizard anfitrião: envio e erros da API", () => {
  it("REQ-HREG-004 REQ-HREG-007 envia uma vez ao cadastro de usuários, sem cpf e sem role; mostra o sucesso", async () => {
    const bodies: unknown[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post(HOST_REGISTER_URL, async ({ request }) => {
        bodies.push(await request.json());
        await gate;
        return HttpResponse.json(apiOk({ user: hostUser }), { status: 201 });
      }),
    );
    const { user } = renderWizard();
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    const busy = await screen.findByRole("button", { name: actions.submitting });
    fireEvent.click(busy);
    fireEvent.submit(busy.closest("form")!);
    await delay(20);
    expect(bodies).toHaveLength(1);
    release();

    expect(await screen.findByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeInTheDocument();
    expect(bodies).toEqual([ACCOUNT_BODY]);
    expect(bodies[0]).not.toHaveProperty("cpf");
    expect(bodies[0]).not.toHaveProperty("role");
    expect(screen.getByRole("link", { name: "Começar a verificação" })).toHaveAttribute("href", "/host/application");
    expect(screen.getByRole("link", { name: "Fazer isso depois" })).toHaveAttribute("href", "/host");
  });

  it("REQ-HREG-005 e-mail já com conta de anfitrião: aviso no passo 1 com o link para entrar como anfitrião", async () => {
    server.use(
      http.post(HOST_REGISTER_URL, () => HttpResponse.json(apiFail("AUTH_EMAIL_ALREADY_REGISTERED"), { status: 409 })),
    );
    const { user } = renderWizard();
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Esse e-mail já tem conta de anfitrião. Quer entrar?");
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(within(screen.getByRole("alert")).getByRole("link", { name: actions.login })).toHaveAttribute(
      "href",
      "/login?as=host",
    );
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it("REQ-HREG-005 o link para entrar leva o next junto", async () => {
    server.use(
      http.post(HOST_REGISTER_URL, () => HttpResponse.json(apiFail("AUTH_EMAIL_ALREADY_REGISTERED"), { status: 409 })),
    );
    const { user } = renderWizard("/hosts/42");
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    await screen.findByRole("alert");
    expect(within(screen.getByRole("alert")).getByRole("link", { name: actions.login })).toHaveAttribute(
      "href",
      "/login?as=host&next=%2Fhosts%2F42",
    );
  });

  it("REQ-HREG-006 400 do e-mail volta ao passo 1 e foca o campo", async () => {
    server.use(
      http.post(HOST_REGISTER_URL, () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "inválido", [{ field: "email", messages: ["E-mail recusado pela API."] }]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWizard();
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    expect(await screen.findByRole("heading", { level: 1, name: steps.person.title })).toBeInTheDocument();
    expect(screen.getByText("E-mail recusado pela API.")).toBeInTheDocument();
    await waitFor(() => expect(field(fields.email)).toHaveFocus());
  });

  it("REQ-HREG-006 limite de tentativas: contagem e envio travado até zerar", async () => {
    server.use(
      http.post(HOST_REGISTER_URL, () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "1" } }),
      ),
    );
    const { user } = renderWizard();
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    expect(await screen.findByText(actions.countdown(1))).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    await waitFor(() => expect(submitButton()).toBeEnabled(), { timeout: 3000 });
  });

  it("REQ-HREG-006 falha de rede: aviso genérico e os dados ficam", async () => {
    server.use(
      http.post(HOST_REGISTER_URL, async () => {
        await delay(10);
        return HttpResponse.error();
      }),
    );
    const { user } = renderWizard();
    await reachSubmit(user, HOST);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toBe("");
    expect(heading()).toHaveTextContent(steps.address.title);
    expect(field("Número")).toHaveValue("120");
  });
});
