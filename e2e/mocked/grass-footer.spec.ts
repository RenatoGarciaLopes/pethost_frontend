import { expect, test, type Page } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../support/account";
import { hideDevIndicator } from "../support/devIndicator";
import { waitForHydration } from "../support/hydration";
import { LISTING_ID } from "../support/handlers/listingPage.mjs";

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
  await expect(footer.getByText(/Todos os direitos reservados/)).toBeInViewport();
  await expect.poll(() => descida(page)).toBeGreaterThan(0.95);
});

test("093 navega do cantinho para Como funciona e registra rodapé responsivo", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const width = testInfo.project.name === "mocked-mobile" ? 390 : 1440;
  await page.setViewportSize({ width, height: 1000 });
  for (const [label, path] of [
    ["home", "/"],
    ["cantinho", `/listings/${LISTING_ID}`],
  ]) {
    await page.goto(path);
    const footer = page.getByRole("contentinfo");
    await footer.scrollIntoViewIfNeeded();
    await expect(footer.getByRole("link", { name: "Abrir meu cantinho" })).toHaveAttribute("href", "/register/host");
    await expect(footer.getByText(/Todos os direitos reservados/)).toBeVisible();
    await scrollToEnd(page);
    const rights = footer.getByText(/Todos os direitos reservados/);
    await expect(rights).toBeInViewport();
    if (label === "cantinho" && width === 390) {
      const bounds = await rights.boundingBox();
      const request = await page
        .getByRole("link", { name: "Pedir estadia", exact: true })
        .filter({ visible: true })
        .boundingBox();
      expect(bounds!.y + bounds!.height).toBeLessThan(request!.y);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`093-${label}-${width}.png`), fullPage: true });
    await footer.screenshot({ path: testInfo.outputPath(`093-${label}-${width}-footer.png`) });
  }
  // O clique só prepara a modalidade: o foco programático não deve desenhar anel.
  await page.getByRole("contentinfo").getByText("PetHost", { exact: true }).click();
  const firstLink = page.getByRole("contentinfo").getByRole("link", { name: "Início / Buscar" });
  await firstLink.focus();
  await expect(firstLink).toHaveCSS("outline-style", "none");
  await page.keyboard.press("Tab");
  const howLink = page.getByRole("contentinfo").getByRole("link", { name: "Como funciona" });
  await expect(howLink).toBeFocused();
  await expect(howLink).toHaveCSS("outline-style", "solid");
  await expect(howLink).toHaveCSS("outline-color", "rgb(254, 250, 243)");
  await page.getByRole("contentinfo").getByRole("link", { name: "Como funciona" }).click();
  await expect(page).toHaveURL(/\/#como-funciona$/);
  await expect(page.locator("#como-funciona")).toBeInViewport({ timeout: 30_000 });
});

test("REQ-UIC-011 o rodapé aparece na casca do tutor e não aparece em entrar nem no admin", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(120_000);
  await page.goto("/login");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByTestId("grass-footer")).toHaveCount(0);
  await loginAccount(page, baseURL!);
  await page.goto("/pets", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByTestId("grass-footer")).toBeAttached();
  await page.context().clearCookies();
  await loginAccount(page, baseURL!, "admin", "admin");
  await page.goto("/admin/users", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByTestId("grass-footer")).toHaveCount(0);
});
