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
  fill,
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

const { fields, fieldErrors, actions, steps } = registrationCopy;
const REGISTER_URL = "*/api/owners/register";
const OWNER = { withCpf: true };

beforeEach(() => {
  vi.clearAllMocks();
  server.use(viaCepHandler);
});

function renderWizard(next: string | null = null) {
  return renderWithProviders(<RegistrationWizard role="owner" next={next} />, {
    theme: quintalTheme,
  });
}

// Formulário inteiro preenchido no jsdom: cada caso leva alguns segundos.
vi.setConfig({ testTimeout: 30_000 });

describe("RegistrationWizard: caminho feliz", () => {
  it("074 abre no passo 1 com três etapas visuais e os cartões de papel", () => {
    renderWizard();
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(screen.getAllByText(steps.person.label).length).toBeGreaterThan(0);
    expect(screen.getAllByText(steps.address.label).length).toBeGreaterThan(0);
    expect(screen.getByText("Passo 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Tenho pet e vou viajar/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("O que a gente faz com cada dado")).not.toBeInTheDocument();
  });

  it("REQ-OREG-003 valida o campo ao sair dele", async () => {
    const { user } = renderWizard();
    await user.type(field(fields.email), "camila@");
    await user.tab();
    expect(await screen.findByText(fieldErrors.emailInvalid)).toBeInTheDocument();
  });

  it("REQ-OREG-003 Continuar valida o passo inteiro, fica no passo 1 e foca o primeiro erro", async () => {
    const { user } = renderWizard();
    await user.click(continueButton());
    expect(await screen.findByText(fieldErrors.fullNameMissing)).toBeInTheDocument();
    expect(screen.getByText(fieldErrors.cpfMissing)).toBeInTheDocument();
    expect(heading()).toHaveTextContent(steps.person.title);
    await waitFor(() => expect(field(fields.fullName)).toHaveFocus());
  });

  it("REQ-OREG-002 passo 1 válido vai ao endereço e foca o título do passo", async () => {
    const { user } = renderWizard();
    await fillPerson(user, OWNER);
    await user.click(continueButton());
    const title = await screen.findByRole("heading", { level: 1, name: steps.address.title });
    await waitFor(() => expect(title).toHaveFocus());
    expect(screen.getByText(steps.address.why)).toBeInTheDocument();
  });

  it("REQ-OREG-007 voltar mantém tudo o que já foi respondido", async () => {
    const { user } = renderWizard();
    await fillPerson(user, OWNER);
    await user.click(continueButton());
    await screen.findByRole("heading", { level: 1, name: steps.address.title });
    await fill(user, "CEP", "87020000");
    await screen.findByDisplayValue("Avenida Brasil");
    await user.click(screen.getByRole("button", { name: actions.back }));

    expect(await screen.findByRole("heading", { level: 1, name: steps.person.title })).toBeInTheDocument();
    expect(field(fields.fullName)).toHaveValue("Camila Souza");
    expect(field(fields.phone)).toHaveValue("(44) 99999-0000");
    expect(field(fields.cpf)).toHaveValue("529.982.247-25");

    await user.click(continueButton());
    await screen.findByRole("heading", { level: 1, name: steps.address.title });
    expect(field("CEP")).toHaveValue("87020-000");
    expect(field("Rua")).toHaveValue("Avenida Brasil");
  });

  it("074 voltar no passo 1 volta ao histórico anterior", async () => {
    const { user } = renderWizard("/hosts/42");
    await user.click(screen.getByRole("button", { name: actions.back }));
    expect(router.back).toHaveBeenCalled();
  });

  it("REQ-OREG-006 explica por que pede CPF e nascimento no próprio campo", () => {
    renderWizard();
    expect(field(fields.cpf)).toHaveAccessibleDescription(fields.cpfHelp);
    expect(field(fields.birthDate)).toHaveAccessibleDescription(fields.birthDateHelp);
  });

  it("REQ-OREG-016 autocomplete certo em cada campo", async () => {
    const { user } = renderWizard();
    expect(field(fields.fullName)).toHaveAttribute("autocomplete", "name");
    expect(field(fields.email)).toHaveAttribute("autocomplete", "email");
    expect(field(fields.email)).toHaveAttribute("type", "email");
    expect(field(fields.password)).toHaveAttribute("autocomplete", "new-password");
    expect(field(fields.phone)).toHaveAttribute("autocomplete", "tel");
    expect(field(fields.birthDate)).toHaveAttribute("autocomplete", "bday");
    expect(field(fields.cpf)).toHaveAttribute("autocomplete", "off");
    expect(field(fields.cpf)).toHaveAttribute("inputmode", "numeric");

    await fillPerson(user, OWNER);
    await user.click(continueButton());
    await screen.findByRole("heading", { level: 1, name: steps.address.title });
    expect(field("CEP")).toHaveAttribute("autocomplete", "postal-code");
    expect(field("CEP")).toHaveAttribute("inputmode", "numeric");
    expect(field("Rua")).toHaveAttribute("autocomplete", "address-line1");
    expect(field("Cidade")).toHaveAttribute("autocomplete", "address-level2");
    expect(field("UF")).toHaveAttribute("autocomplete", "address-level1");
  });

  it("REQ-OREG-017 o botão de continuar diz o que vem", async () => {
    const { user } = renderWizard();
    expect(continueButton()).toHaveAttribute("type", "submit");
    await fillPerson(user, OWNER);
    await user.click(continueButton());
    await screen.findByRole("heading", { level: 1, name: steps.address.title });
    expect(screen.getByRole("button", { name: actions.submit })).toHaveAttribute("type", "submit");
  });
});

describe("RegistrationWizard: envio e erros da API", () => {
  it("REQ-OREG-008 envia uma vez só, sem máscaras e com a data ISO; mostra a tela de sucesso", async () => {
    const bodies: unknown[] = [];
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post(REGISTER_URL, async ({ request }) => {
        bodies.push(await request.json());
        await gate;
        return HttpResponse.json(apiOk({ user: sessionUserFixture }), { status: 201 });
      }),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    const busy = await screen.findByRole("button", { name: actions.submitting });
    expect(busy).toBeDisabled();
    expect(busy).toHaveAttribute("aria-busy", "true");
    // Segundo envio enquanto o primeiro está no ar: clique no botão travado e submit forçado do form.
    fireEvent.click(busy);
    fireEvent.submit(busy.closest("form")!);
    await delay(20);
    expect(bodies).toHaveLength(1);
    release();

    expect(await screen.findByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeInTheDocument();
    expect(bodies).toEqual([{ ...ACCOUNT_BODY, cpf: "52998224725" }]);
  });

  it("REQ-OREG-009 400 do CEP fica no passo 2 com a mensagem no campo", async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "inválido", [{ field: "address.zipCode", messages: ["CEP inválido na API."] }]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    expect(await screen.findByText("CEP inválido na API.")).toBeInTheDocument();
    expect(heading()).toHaveTextContent(steps.address.title);
    await waitFor(() => expect(field("CEP")).toHaveFocus());
  });

  it("REQ-OREG-009 400 do e-mail volta ao passo 1 e foca o campo", async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json(
          apiFail("VALIDATION_ERROR", "inválido", [{ field: "email", messages: ["E-mail recusado pela API."] }]),
          { status: 400 },
        ),
      ),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    expect(await screen.findByRole("heading", { level: 1, name: steps.person.title })).toBeInTheDocument();
    expect(screen.getByText("E-mail recusado pela API.")).toBeInTheDocument();
    await waitFor(() => expect(field(fields.email)).toHaveFocus());
  });

  it("REQ-OREG-010 e-mail já com conta de tutor: aviso no passo 1 com o link para entrar", async () => {
    server.use(
      http.post(REGISTER_URL, () => HttpResponse.json(apiFail("AUTH_EMAIL_ALREADY_REGISTERED"), { status: 409 })),
    );
    const { user } = renderWizard("/hosts/42");
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Esse e-mail já tem conta de tutor. Quer entrar?");
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(within(screen.getByRole("alert")).getByRole("link", { name: actions.login })).toHaveAttribute(
      "href",
      "/login?as=owner&next=%2Fhosts%2F42",
    );
    await waitFor(() => expect(alert).toHaveFocus());
  });

  it("REQ-OREG-011 CPF em outra conta: erro no campo CPF, no passo 1", async () => {
    server.use(
      http.post(REGISTER_URL, () => HttpResponse.json(apiFail("OWNER_CPF_ALREADY_REGISTERED"), { status: 409 })),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    expect(await screen.findByRole("heading", { level: 1, name: steps.person.title })).toBeInTheDocument();
    expect(field(fields.cpf)).toHaveAccessibleDescription(/Esse CPF já está em outra conta/);
    expect(field(fields.cpf)).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(field(fields.cpf)).toHaveFocus());
  });

  it("REQ-OREG-012 limite de tentativas: contagem e envio travado até zerar", async () => {
    server.use(
      http.post(REGISTER_URL, () =>
        HttpResponse.json(apiFail("TOO_MANY_REQUESTS"), { status: 429, headers: { "Retry-After": "2" } }),
      ),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    expect(await screen.findByText(actions.countdown(2))).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    await waitFor(() => expect(submitButton()).toBeEnabled(), { timeout: 4000 });
    expect(screen.queryByText(/Dá pra tentar de novo/)).not.toBeInTheDocument();
  });

  it("REQ-OREG-012 falha de rede: aviso genérico e os dados ficam", async () => {
    server.use(
      http.post(REGISTER_URL, async () => {
        await delay(10);
        return HttpResponse.error();
      }),
    );
    const { user } = renderWizard();
    await reachSubmit(user, OWNER);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toBe("");
    expect(heading()).toHaveTextContent(steps.address.title);
    expect(field("Número")).toHaveValue("120");
    expect(field("CEP")).toHaveValue("87020-000");
  });
});

it("074 troca de papel vazia navega direto e com dados exige confirmar, cancelar preserva", async () => {
  const { user } = renderWizard("/search");
  await user.click(screen.getByRole("button", { name: /Quero receber pets em casa/ }));
  expect(router.push).toHaveBeenLastCalledWith("/register/host?next=%2Fsearch");
  router.push.mockClear();
  await fill(user, fields.fullName, "Pessoa de teste");
  await user.click(screen.getByRole("button", { name: /Quero receber pets em casa/ }));
  expect(screen.getByRole("dialog", { name: "Trocar o tipo de conta?" })).toBeVisible();
  expect(router.push).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Continuar preenchendo" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  expect(field(fields.fullName)).toHaveValue("Pessoa de teste");
  await user.click(screen.getByRole("button", { name: /Quero receber pets em casa/ }));
  await user.click(screen.getByRole("button", { name: "Trocar de conta" }));
  expect(router.push).toHaveBeenCalledWith("/register/host?next=%2Fsearch");
});
