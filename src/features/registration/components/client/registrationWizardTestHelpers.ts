import { screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { registrationCopy } from "../../lib/registrationCopy";

/**
 * Passos comuns dos testes do `RegistrationWizard` (tutor e anfitrião). Só para testes: nada aqui entra
 * no app. O render fica em cada arquivo de teste, que é quem pode importar `src/test`.
 */
const { fields, actions, steps } = registrationCopy;

/** Endereço que o ViaCEP devolve para o CEP de teste. */
const VIACEP_ADDRESS = {
  cep: "87020-000",
  logradouro: "Avenida Brasil",
  bairro: "Zona 01",
  localidade: "Maringá",
  uf: "PR",
};

/** ViaCEP simulado: 87020000 existe, o resto não. Use com `server.use(viaCepHandler)`. */
export const viaCepHandler = http.get("https://viacep.com.br/ws/:cep/json/", ({ params }) =>
  HttpResponse.json(params.cep === "87020000" ? VIACEP_ADDRESS : { erro: true }),
);

/** Campo pelo começo do rótulo (o MUI acrescenta " *" nos obrigatórios). */
export const field = (label: string) => screen.getByLabelText(new RegExp(`^${label.replace("?", "\\?")}`));
export const heading = () => screen.getByRole("heading", { level: 1 });
export const continueButton = () => screen.getByRole("button", { name: actions.toAddress });
export const submitButton = () =>
  screen.getByRole("button", { name: new RegExp(`${actions.submit}|${actions.submitting}`) });

/** Cola o texto no campo (mais rápido que digitar tecla a tecla no jsdom). */
export async function fill(user: UserEvent, label: string, text: string) {
  await user.click(field(label));
  await user.paste(text);
}

/** Passo 1 válido; o CPF só no tutor (`withCpf`). */
export async function fillPerson(user: UserEvent, { withCpf }: { withCpf: boolean }) {
  await fill(user, fields.fullName, "Camila Souza");
  await fill(user, fields.email, "camila@exemplo.com");
  await fill(user, fields.password, "Senha#forte1");
  await fill(user, fields.phone, "44999990000");
  await fill(user, fields.birthDate, "15031990");
  if (withCpf) await fill(user, fields.cpf, "52998224725");
}

export async function fillAddress(user: UserEvent) {
  await fill(user, "CEP", "87020000");
  await screen.findByDisplayValue("Avenida Brasil");
  await fill(user, "Número", "120");
}

/** Passo 1 válido, passo 2 com endereço do CEP: pronto para "Criar minha conta". */
export async function reachSubmit(user: UserEvent, options: { withCpf: boolean }) {
  await fillPerson(user, options);
  await user.click(continueButton());
  await screen.findByRole("heading", { level: 1, name: steps.address.title });
  await fillAddress(user);
}

/** Corpo esperado na API para o cadastro preenchido por `reachSubmit`, sem o CPF. */
export const ACCOUNT_BODY = {
  fullName: "Camila Souza",
  email: "camila@exemplo.com",
  password: "Senha#forte1",
  phone: "44999990000",
  birthDate: "1990-03-15",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};
