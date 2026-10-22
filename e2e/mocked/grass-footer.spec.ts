import { expect, test, type Page } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../support/account";
import { hideDevIndicator } from "../support/devIndicator";
import { waitForHydration } from "../support/hydration";

test.setTimeout(60_000);

test.beforeEach(async ({ page }) => {
  await hideDevIndicator(page);
  await resetAccountMock(page);
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

async function scrollToEnd(page: Page) {
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
}
const descida = (page: Page) =>
  page.getByTestId("grass-footer").evaluate((element) => Number(element.style.getPropertyValue("--descida")));

test("REQ-UIC-011 o início termina no rodapé de gramado e a terra escurece ao chegar ao fim", async ({ page }) => {
  await page.goto("/");
  await waitForHydration(page.getByRole("main"));
  const footer = page.getByTestId("grass-footer");
  await expect(footer).toBeAttached();
  await expect.poll(() => descida(page)).toBe(0);
  await scrollToEnd(page);
  await expect(footer).toBeInViewport({ ratio: 0.99 });
  await expect.poll(() => descida(page)).toBeGreaterThan(0.95);
});

test("REQ-UIC-011 o rodapé aparece na casca do tutor e não aparece em entrar nem no admin", async ({ page, baseURL }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("grass-footer")).toHaveCount(0);
  await loginAccount(page, baseURL!);
  await page.goto("/pets");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByTestId("grass-footer")).toBeAttached();
  await page.context().clearCookies();
  await loginAccount(page, baseURL!, "admin", "admin");
  await page.goto("/admin/users");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByTestId("grass-footer")).toHaveCount(0);
});
