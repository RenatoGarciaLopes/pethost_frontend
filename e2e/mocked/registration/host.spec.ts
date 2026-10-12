import { expect, test } from "@playwright/test";
import { expectHttpOnlySession, field, fillAddress, fillPerson, mockViaCep } from "../../support/registration";

/**
 * Cadastro de anfitrião de ponta a ponta no Next real contra o backend simulado (spec 012).
 * REQ-HREG-001, 003, 004, 005, 007, 009 e 010.
 */
/** E-mail que o mock diz já ter conta (`e2e/support/handlers/registration.mjs`). */
const TAKEN_EMAIL = "tutora@pethost.test";

test.beforeEach(async ({ page }) => mockViaCep(page));

test("escolha → dois passos sem CPF → conta criada e convite para a verificação", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("radio", { name: /Quero receber pets em casa/ }).check();
  await page.getByRole("link", { name: "Continuar como anfitrião" }).click();
  await expect(page).toHaveURL(/\/register\/host$/);
  await expect(page).toHaveTitle("Criar conta de anfitrião · PetHost");

  await expect(page.getByText("O CPF e os documentos ficam pra verificação, no próximo passo.")).toBeVisible();
  await expect(
    page.getByText("Se você também tem conta de tutor, esta senha é só da conta de anfitrião."),
  ).toBeVisible();
  await expect(field(page, "CPF")).toHaveCount(0);

  await fillPerson(page);
  await fillAddress(page);

  const submit = page.getByRole("button", { name: "Criar minha conta" });
  if (test.info().project.use.isMobile) await expect(submit).toBeInViewport();
  const request = page.waitForRequest((candidate) => candidate.url().endsWith("/api/users/register"));
  await submit.click();
  const body = (await request).postDataJSON();
  expect(body).not.toHaveProperty("cpf");
  expect(body).not.toHaveProperty("role");

  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();
  await expect(page.getByText(/Sua conta de anfitrião está pronta/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar a verificação" })).toHaveAttribute("href", "/host/application");
  await expect(page.getByRole("link", { name: "Fazer isso depois" })).toHaveAttribute("href", "/host");
  await expectHttpOnlySession(page);
});

test("e-mail que já tem conta volta ao passo 1 com o link para entrar como anfitrião", async ({ page }) => {
  await page.goto("/register/host");
  await fillPerson(page, { email: TAKEN_EMAIL });
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Primeiro, você" })).toBeVisible();
  await expect(page.getByText("Esse e-mail já tem conta de anfitrião. Quer entrar?")).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/login?as=host");
});

test("com sessão, /register/host vai direto para a casa do anfitrião", async ({ page, baseURL }) => {
  await page.goto("/register/host");
  await fillPerson(page);
  await fillAddress(page);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Prazer, Camila!" })).toBeVisible();

  await page.goto("/register/host");
  await expect(page).toHaveURL(`${baseURL}/host`);
});
