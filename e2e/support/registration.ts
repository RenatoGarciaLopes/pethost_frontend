import { expect, type Page } from "@playwright/test";
import { waitForHydration } from "./hydration";

/**
 * Passos comuns dos E2E de cadastro (tutor, spec 011; anfitrião, spec 012) contra o backend simulado.
 * O ViaCEP é interceptado no navegador: o teste nunca sai para a rede.
 */
const VIACEP = { cep: "87020-000", logradouro: "Avenida Brasil", bairro: "Zona 01", localidade: "Maringá", uf: "PR" };

/** Use no `beforeEach`: 87020000 existe, o resto não. */
export async function mockViaCep(page: Page) {
  await page.route("https://viacep.com.br/ws/**", (route) =>
    route.fulfill({ json: route.request().url().includes("/87020000/") ? VIACEP : { erro: true } }),
  );
}

/** Só a rota visível: o App Router pode manter a tela anterior oculta durante a troca de papel. */
export const field = (page: Page, label: string) => page.getByLabel(new RegExp(`^${label}`)).filter({ visible: true });

/** E-mail único por execução: o mock não guarda contas, mas o teste não depende disso. */
const uniqueEmail = (prefix: string) => `${prefix}.${Date.now()}.${Math.floor(Math.random() * 1e6)}@pethost.test`;

/**
 * Passo 1 válido e "Continuar": com `cpf`, preenche o CPF (tutor); sem, o anfitrião. E-mail único se não vier.
 * Espera a hidratação antes de preencher, para o React não restaurar valores iniciais.
 * @example await fillPerson(page, { cpf: "52998224725" });
 */
export async function fillPerson(page: Page, { cpf, email }: { cpf?: string; email?: string } = {}) {
  await waitForHydration(field(page, "Nome completo"));
  await field(page, "Nome completo").fill("Camila Souza");
  await field(page, "E-mail").fill(email ?? uniqueEmail(cpf ? "tutor" : "anfitriao"));
  await field(page, "Crie uma senha").fill("Senha#forte1");
  await field(page, "Celular com DDD").fill("44999990000");
  await field(page, "Nascimento").fill("15031990");
  if (cpf) await field(page, "CPF").fill(cpf);
  await page.getByRole("button", { name: "Continuar: endereço" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Onde você mora" })).toBeVisible();
}

export async function fillAddress(page: Page) {
  await field(page, "CEP").fill("87020000");
  await expect(field(page, "Rua")).toHaveValue("Avenida Brasil");
  await expect(field(page, "Cidade")).toHaveValue("Maringá");
  await field(page, "Número").fill("120");
}

/** Os tokens viraram cookies HttpOnly, invisíveis ao JavaScript da página. */
export async function expectHttpOnlySession(page: Page) {
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "pethost_at")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "pethost_rt")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/pethost_(at|rt)/);
}
