import { expect, test, type Page } from "@playwright/test";

/**
 * Cadastro de tutor de ponta a ponta no Next real contra o backend simulado (spec 011).
 * O ViaCEP é interceptado no navegador: o teste nunca sai para a rede.
 * REQ-OREG-001, 002, 005, 008, 011, 013, 015 e 017.
 */
const VIACEP = { cep: "87020-000", logradouro: "Avenida Brasil", bairro: "Zona 01", localidade: "Maringá", uf: "PR" };
/** CPF válido que o mock diz já estar em outra conta (`e2e/support/handlers/owners.mjs`). */
const TAKEN_CPF = "11144477735";

test.beforeEach(async ({ page }) => {
  await page.route("https://viacep.com.br/ws/**", (route) =>
    route.fulfill({ json: route.request().url().includes("/87020000/") ? VIACEP : { erro: true } }),
  );
});

const field = (page: Page, label: string) => page.getByLabel(new RegExp(`^${label}`));

/** E-mail único por execução: o mock não guarda contas, mas o teste não depende disso. */
const uniqueEmail = () => `tutor.${Date.now()}.${Math.floor(Math.random() * 1e6)}@pethost.test`;

async function fillPerson(page: Page, cpf = "52998224725") {
  await field(page, "Seu nome completo").fill("Camila Souza");
  await field(page, "E-mail").fill(uniqueEmail());
  await field(page, "Crie uma senha").fill("Senha#forte1");
  await field(page, "Celular com DDD").fill("44999990000");
  await field(page, "Quando você nasceu\\?").fill("15031990");
  await field(page, "CPF").fill(cpf);
  await page.getByRole("button", { name: "Continuar: endereço" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Onde você mora" })).toBeVisible();
}

async function fillAddress(page: Page) {
  await field(page, "CEP").fill("87020000");
  await expect(field(page, "Rua")).toHaveValue("Avenida Brasil");
  await expect(field(page, "Cidade")).toHaveValue("Maringá");
  await field(page, "Número").fill("120");
}

test("escolha → dois passos → conta criada, com cookies HttpOnly", async ({ page }) => {
  await page.goto("/register?next=%2Fhosts%2F42");
  await page.getByRole("radio", { name: /Tenho pet e vou viajar/ }).check();
  await page.getByRole("link", { name: "Continuar como tutor" }).click();
  await expect(page).toHaveURL(/\/register\/owner\?next=%2Fhosts%2F42$/);

  await fillPerson(page);
  await fillAddress(page);

  const submit = page.getByRole("button", { name: "Criar minha conta" });
  // REQ-OREG-017: no celular a barra de ações fica fixa embaixo, sem precisar rolar.
  if (test.info().project.use.isMobile) await expect(submit).toBeInViewport();
  await submit.click();

  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar pra onde eu estava" })).toHaveAttribute("href", "/hosts/42");

  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "pethost_at")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "pethost_rt")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/pethost_(at|rt)/);
});

test("CPF já em outra conta volta ao passo 1 com o erro no campo", async ({ page }) => {
  await page.goto("/register/owner");
  await fillPerson(page, TAKEN_CPF);
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Primeiro, você" })).toBeVisible();
  await expect(page.getByText(/Esse CPF já está em outra conta/)).toBeVisible();
  await expect(field(page, "CPF")).toBeFocused();
});

test("com sessão, /register/owner vai direto para a casa do tutor", async ({ page, baseURL }) => {
  await page.goto("/register/owner");
  await fillPerson(page);
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();

  await page.goto("/register/owner");
  await expect(page).toHaveURL(`${baseURL}/`);
});
