import { expect, test } from "@playwright/test";
import { hideDevIndicator } from "../../support/devIndicator";
import { waitForHydration } from "../../support/hydration";

test("REQ-FOC-081 clique na barra não mostra contorno; Tab real mostra na célula; clique de novo esconde", async ({
  page,
}) => {
  await page.goto("/");
  await hideDevIndicator(page);
  await waitForHydration(page.getByRole("main"));
  const openSearch = page.getByRole("button", { name: "Onde, datas e pet", exact: true });
  if (await openSearch.isVisible()) await openSearch.click();

  const where = page.getByRole("textbox", { name: "Onde" });
  const whereCell = where.locator("../..");
  await where.click();
  await expect(where).toBeFocused();
  await expect(whereCell).toHaveCSS("outline-style", "none");

  await page.keyboard.press("Tab");
  const next = page.locator(":focus");
  await expect(next.locator("..")).toHaveCSS("outline-style", "solid");
  await expect(next.locator("..")).toHaveCSS("outline-color", "rgb(31, 26, 23)");
  await expect(next.locator("..")).toHaveCSS("outline-width", "3px");

  await where.click();
  await expect(whereCell).toHaveCSS("outline-style", "none");
});
