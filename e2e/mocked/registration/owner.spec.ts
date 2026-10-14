import { expect, test } from "@playwright/test";
import { waitForHydration } from "../../support/hydration";
import { expectHttpOnlySession, field, fillAddress, fillPerson, mockViaCep } from "../../support/registration";

/**
 * Cadastro de tutor de ponta a ponta no Next real contra o backend simulado (spec 011).
 * REQ-OREG-001, 002, 005, 008, 011, 013, 015 e 017.
 */
const CPF = "52998224725";
/** CPF válido que o mock diz já estar em outra conta (`e2e/support/handlers/owners.mjs`). */
const TAKEN_CPF = "11144477735";

test.beforeEach(async ({ page }) => mockViaCep(page));

test("escolha → dois passos → conta criada, com cookies HttpOnly", async ({ page }) => {
  await page.goto("/register?next=%2Fhosts%2F42");
  const role = page.getByRole("radio", { name: /Tenho pet e vou viajar/ });
  await waitForHydration(role);
  await role.check();
  await page.getByRole("link", { name: "Continuar como tutor" }).click();
  await expect(page).toHaveURL(/\/register\/owner\?next=%2Fhosts%2F42$/);

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

  await expect(page.getByRole("heading", { level: 1, name: "Primeiro, você" })).toBeVisible();
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
