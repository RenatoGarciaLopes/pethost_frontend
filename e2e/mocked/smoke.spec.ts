import { expect, test } from "@playwright/test";

// A home chega na spec 040; até lá a primeira tela pública é a de entrar.
test("REQ-TOOL-010 o app responde e tem título PetHost", async ({ page }) => {
  const response = await page.goto("/login");
  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/PetHost/);
});
