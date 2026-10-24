import { expect, test } from "@playwright/test";
import { LISTING_ID } from "../support/handlers/listingPage.mjs";

test.setTimeout(90_000);

for (const route of ["results", "listing"] as const) {
  test(`096 cabeçalho e offsets ao rolar: ${route}`, async ({ page }, testInfo) => {
    const mobile = testInfo.project.name.includes("mobile");
    const width = mobile ? 390 : 1440;
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route === "results" ? "/?where=Maring%C3%A1" : `/listings/${LISTING_ID}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 60_000 });
    const header = page.getByRole("banner");
    await expect
      .poll(async () =>
        header.evaluate((el) =>
          Math.abs(
            parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--app-header-height")) -
              el.getBoundingClientRect().height,
          ),
        ),
      )
      .toBeLessThan(1);
    await page.evaluate(() => window.scrollTo(0, 650));
    await expect.poll(async () => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
    expect(await header.evaluate((el) => getComputedStyle(el).position)).toBe("sticky");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const bottom = await header.evaluate((el) => el.getBoundingClientRect().bottom);
    if (!mobile) {
      const panel =
        route === "results"
          ? page.getByRole("region", { name: "Mapa dos cantinhos" }).locator("..")
          : page.locator("aside").locator("..");
      await expect(panel).toBeVisible({ timeout: 30_000 });
      if (route === "results") {
        await expect(panel.getByRole("button", { name: /R\$/ }).first()).toBeVisible({ timeout: 30_000 });
      }
      const geometry = await panel.evaluate((el) => ({
        top: el.getBoundingClientRect().top,
        offset: parseFloat(getComputedStyle(el).top),
      }));
      expect(geometry.offset).toBeCloseTo(bottom + 24, 0);
      expect(geometry.top).toBeGreaterThanOrEqual(bottom);
    } else if (route === "listing") {
      const booking = page.getByRole("link", { name: "Pedir estadia" }).filter({ visible: true });
      await expect(booking).toBeVisible();
      expect((await booking.boundingBox())!.y).toBeGreaterThan(700);
    }
    await page.screenshot({ path: `test-results/096-${route}-${width}-scrolled.png` });
    await page.locator("#conteudo").evaluate((el) => el.scrollIntoView());
    expect(await page.locator("#conteudo").evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(
      bottom - 1,
    );
    await page.evaluate(() => window.scrollTo(0, 650));
    const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
    await skip.focus();
    await skip.press("Enter");
    await expect(page.locator("#conteudo")).toBeFocused();
    expect(await page.locator("#conteudo").evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(
      bottom - 1,
    );
  });
}

test("096 âncora Como funciona fica abaixo do cabeçalho", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: testInfo.project.name.includes("mobile") ? 390 : 1440, height: 900 });
  await page.goto("/");
  const target = page.locator("#como-funciona");
  await expect(target).toBeVisible({ timeout: 60_000 });
  await target.evaluate((el) => el.scrollIntoView());
  const headerBottom = await page.getByRole("banner").evaluate((el) => el.getBoundingClientRect().bottom);
  expect(await target.evaluate((el) => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(headerBottom);
});
