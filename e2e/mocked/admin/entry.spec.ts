import { expect, test } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.beforeEach(async ({ page }) => {
  await resetAccountMock(page);
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("entrada /admin passa pelo login e abre a fila sem 404", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fhost-applications$/);
  const account = accountFixture("admin", "admin");
  const email = page.getByLabel("E-mail", { exact: false });
  await waitForHydration(email);
  await email.fill(account.user.email);
  await page.getByLabel(/^Senha/).fill(account.password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/host-applications$/);
  await expect(page.getByRole("heading", { name: "Fila de verificação" })).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/host-applications$/);
});

test("tutor não entra no painel pelo atalho /admin", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/admin");
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole("heading", { name: "Fila de verificação" })).toHaveCount(0);
});
