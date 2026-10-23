import { expect, test } from "@playwright/test";
import { expectHttpOnlySession, field, fillAddress, fillPerson, mockViaCep } from "../../support/registration";
import { waitForHydration } from "../../support/hydration";

test("074 composição de cadastro e foco em 1440 e 390", async ({ page }, testInfo) => {
  const width = testInfo.project.name.includes("mobile") ? 390 : 1440;
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/register");
  const name = field(page, "Nome completo");
  await waitForHydration(name);
  await name.fill("Pessoa Exemplo");
  await field(page, "E-mail").fill("cadastro@example.test");
  await field(page, "Celular com DDD").fill("44999990000");
  await field(page, "Nascimento").fill("15031990");
  await field(page, "CPF").fill("52998224725");
  await field(page, "Crie uma senha").fill("Teste2026");
  // O print mostra o estado em repouso; a interface de desenvolvimento não pertence ao produto.
  await page.getByRole("heading", { level: 1 }).click();
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
  await expect(page.getByText("Passo 1 de 3", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Bora se conhecer.");
  await expect(page.getByText("O que a gente faz com cada dado")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/register-074-${width}.png`, fullPage: true });
});

/**
 * Cadastro de tutor de ponta a ponta no Next real contra o backend simulado (spec 011).
 * REQ-OREG-001, 002, 005, 008, 011, 013, 015 e 017.
 */
const CPF = "52998224725";
/** CPF válido que o mock diz já estar em outra conta (`e2e/support/handlers/owners.mjs`). */
const TAKEN_CPF = "11144477735";

test.beforeEach(async ({ page }) => mockViaCep(page));

test("074 entrada direta → dois passos reais → conta criada, com cookies HttpOnly", async ({ page }) => {
  await page.goto("/register?next=%2Fhosts%2F42");
  await expect(page.getByRole("button", { name: /Tenho pet e vou viajar/ })).toHaveAttribute("aria-pressed", "true");

  await fillPerson(page, { cpf: CPF });
  await fillAddress(page);

  const submit = page.getByRole("button", { name: "Criar minha conta" });
  // REQ-OREG-017: no celular a barra de ações fica fixa embaixo, sem precisar rolar.
  if (test.info().project.use.isMobile) await expect(submit).toBeInViewport();
  await submit.click();

  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar pra onde eu estava" })).toHaveAttribute("href", "/hosts/42");
  await expectHttpOnlySession(page);
});

test("CPF já em outra conta volta ao passo 1 com o erro no campo", async ({ page }) => {
  await page.goto("/register/owner");
  await fillPerson(page, { cpf: TAKEN_CPF });
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Bora se conhecer." })).toBeVisible();
  await expect(page.getByText(/Esse CPF já está em outra conta/)).toBeVisible();
  await expect(field(page, "CPF")).toBeFocused();
});

test("com sessão, /register/owner vai direto para a casa do tutor", async ({ page, baseURL }) => {
  await page.goto("/register/owner");
  await fillPerson(page, { cpf: CPF });
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();

  await page.goto("/register/owner");
  await expect(page).toHaveURL(`${baseURL}/`);
});
