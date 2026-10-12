import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { renderWithProviders } from "@/test/render";
import { registrationCopy } from "../../lib/registrationCopy";
import { RegistrationWizard } from "./RegistrationWizard";

const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));

const { fields, fieldErrors, actions, steps } = registrationCopy;
const REGISTER_URL = "*/api/owners/register";

/** Endereço que o ViaCEP devolve para o CEP de teste. */
const VIACEP_ADDRESS = {
  cep: "87020-000",
  logradouro: "Avenida Brasil",
  bairro: "Zona 01",
  localidade: "Maringá",
  uf: "PR",
};

beforeEach(() => {
  vi.clearAllMocks();
  // ViaCEP simulado: 87020000 existe, o resto não.
  server.use(
    http.get("https://viacep.com.br/ws/:cep/json/", ({ params }) =>
      HttpResponse.json(params.cep === "87020000" ? VIACEP_ADDRESS : { erro: true }),
    ),
  );
});

function renderWizard(next: string | null = null) {
  return renderWithProviders(<RegistrationWizard next={next} aside={<p>faixa lateral</p>} />, {
    theme: quintalTheme,
  });
}

/** Campo pelo começo do rótulo (o MUI acrescenta " *" nos obrigatórios). */
const field = (label: string) => screen.getByLabelText(new RegExp(`^${label.replace("?", "\\?")}`));
const heading = () => screen.getByRole("heading", { level: 1 });
const continueButton = () => screen.getByRole("button", { name: actions.toAddress });

/** Cola o texto no campo (mais rápido que digitar tecla a tecla no jsdom). */
async function fill(user: UserEvent, label: string, text: string) {
  await user.click(field(label));
  await user.paste(text);
}

async function fillPerson(user: UserEvent) {
  await fill(user, fields.fullName, "Camila Souza");
  await fill(user, fields.email, "camila@exemplo.com");
  await fill(user, fields.password, "Senha#forte1");
  await fill(user, fields.phone, "44999990000");
  await fill(user, fields.birthDate, "15031990");
  await fill(user, fields.cpf, "52998224725");
}

async function fillAddress(user: UserEvent) {
  await fill(user, "CEP", "87020000");
  await screen.findByDisplayValue("Avenida Brasil");
  await fill(user, "Número", "120");
}

/** Passo 1 válido, passo 2 com endereço do CEP: pronto para "Criar minha conta". */
async function reachSubmit(user: UserEvent) {
  await fillPerson(user);
  await user.click(continueButton());
  await screen.findByRole("heading", { level: 1, name: steps.address.title });
  await fillAddress(user);
}

const submitButton = () => screen.getByRole("button", { name: new RegExp(`${actions.submit}|${actions.submitting}`) });

// Formulário inteiro preenchido no jsdom: cada caso leva alguns segundos.
vi.setConfig({ testTimeout: 30_000 });

describe("RegistrationWizard: caminho feliz", () => {
  it("REQ-OREG-002 abre no passo 1 com a trilha de 2 passos e a faixa lateral", () => {
    renderWizard();
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(screen.getAllByText(steps.person.label).length).toBeGreaterThan(0);
    expect(screen.getAllByText(steps.address.label).length).toBeGreaterThan(0);
    expect(screen.getByText("faixa lateral")).toBeInTheDocument();
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
    await fillPerson(user);
    await user.click(continueButton());
    const title = await screen.findByRole("heading", { level: 1, name: steps.address.title });
    await waitFor(() => expect(title).toHaveFocus());
    expect(screen.getByText(steps.address.why)).toBeInTheDocument();
  });

  it("REQ-OREG-007 voltar mantém tudo o que já foi respondido", async () => {
    const { user } = renderWizard();
    await fillPerson(user);
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

  it("REQ-OREG-001 voltar no passo 1 leva à escolha de conta, com o next", async () => {
    const { user } = renderWizard("/hosts/42");
    await user.click(screen.getByRole("button", { name: actions.back }));
    expect(router.push).toHaveBeenCalledWith("/register?next=%2Fhosts%2F42");
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

    await fillPerson(user);
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
    await fillPerson(user);
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
    await reachSubmit(user);
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
    expect(bodies).toEqual([
      {
        fullName: "Camila Souza",
        email: "camila@exemplo.com",
        password: "Senha#forte1",
        phone: "44999990000",
        birthDate: "1990-03-15",
        cpf: "52998224725",
        address: {
          zipCode: "87020000",
          street: "Avenida Brasil",
          number: "120",
          neighborhood: "Zona 01",
          city: "Maringá",
          state: "PR",
        },
      },
    ]);
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
    await reachSubmit(user);
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
    await reachSubmit(user);
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
    await reachSubmit(user);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Esse e-mail já tem conta de tutor. Quer entrar?");
    expect(heading()).toHaveTextContent(steps.person.title);
    expect(screen.getByRole("link", { name: actions.login })).toHaveAttribute(
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
    await reachSubmit(user);
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
    await reachSubmit(user);
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
    await reachSubmit(user);
    await user.click(submitButton());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).not.toBe("");
    expect(heading()).toHaveTextContent(steps.address.title);
    expect(field("Número")).toHaveValue("120");
    expect(field("CEP")).toHaveValue("87020-000");
  });
});
