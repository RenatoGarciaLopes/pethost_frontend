import { expect, type Page } from "@playwright/test";
import { switchAccounts } from "./handlers/switchAccounts.mjs";
/** Fixture exclusivamente sintética. @example accountFixture("both", "host"); */
export function accountFixture(scenario = "both", role = "owner") {
  return switchAccounts.find((item) => item.scenario === scenario && item.user.role === role)!;
}
/** Login pelo BFF preserva cookies HttpOnly no contexto do navegador.
 * @example await loginAccount(page, baseURL!, "single");
 */
export async function loginAccount(page: Page, baseURL: string, scenario = "both", role = "owner", password?: string) {
  const account = accountFixture(scenario, role);
  const response = await page.request.post("/api/auth/sessions/login", {
    headers: { origin: baseURL, "x-pethost-request": "1" },
    data: { email: account.user.email, password: password ?? account.password, role },
  });
  expect(response.status()).toBe(200);
}
/** Reinicia só o mock atual; a porta é obrigatória para não atingir a instância antiga.
 * @example await resetAccountMock(page);
 */
export async function resetAccountMock(page: Page) {
  const url = process.env.E2E_ACCOUNT_MOCK_URL;
  if (!url) throw new Error("Defina E2E_ACCOUNT_MOCK_URL para o mock atual.");
  const response = await page.request.post(url + "/__e2e/account/reset");
  expect(response.ok()).toBe(true);
}
/** PNG sintético local evita depender do servidor público de imagens do mock.
 * @example await mockProfileImage(page);
 */
export async function mockProfileImage(page: Page) {
  const image = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aMZ8AAAAASUVORK5CYII=",
    "base64",
  );
  await page.route("https://images.example.test/**", (route) =>
    route.fulfill({
      contentType: "image/png",
      body: image,
    }),
  );
  return image;
}
