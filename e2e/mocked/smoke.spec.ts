import { expect, test } from "@playwright/test";

test("REQ-TOOL-010 a home responde e tem título PetHost", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/PetHost/);
});
