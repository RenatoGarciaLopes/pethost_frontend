import { expect, test } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "admin", "admin");
});
test.afterEach(async ({ page }) => resetAccountMock(page));

test("REQ-AUDIT-001/002 filtra a trilha e mantém a ação na URL", async ({ page }) => {
  await page.goto("/admin/audit-entries");
  await expect(page.getByRole("heading", { name: "Auditoria" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir detalhes: Tutor suspenso$/ })).toHaveCount(2);
  const action = page.getByRole("combobox", { name: "Ação" });
  await waitForHydration(action);
  await action.fill("session.login_succeeded");
  await page.getByRole("button", { name: "Buscar registros" }).click();
  await expect(page).toHaveURL(/action=session\.login_succeeded/);
  await expect(page.getByRole("link", { name: /Abrir detalhes: Entrada autorizada$/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Abrir detalhes: Tutor suspenso$/ })).toHaveCount(0);
});

test("REQ-AUDIT-006/007 abre detalhes e navega ao alvo relacionado", async ({ page }) => {
  await page.goto("/admin/audit-entries");
  const details = page
    .getByRole("link", { name: /Abrir detalhes: Tutor suspenso$/ })
    .and(page.locator('a[href="/admin/audit-entries?entryId=77b9c00c-fdc0-4422-b4c7-7e237741a4a7"]'));
  await waitForHydration(details);
  await details.click();
  await expect(page).toHaveURL(/entryId=77b9c00c-fdc0-4422-b4c7-7e237741a4a7/);
  const dialog = page.getByRole("dialog", { name: "Detalhes do registro" });
  await expect(dialog.getByText("203.0.113.17")).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Abrir registro relacionado" })).toHaveAttribute(
    "href",
    /admin\/users\/owners/,
  );
});

test("REQ-AUDIT-009 bloqueia conta sem papel administrativo", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "owner");
  await page.goto("/admin/audit-entries");
  await expect(page).toHaveURL(new URL("/", baseURL!).toString());
});
