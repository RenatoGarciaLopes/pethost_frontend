import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "../../support/hydration";

const sendLinkButton = (page: Page) => page.getByRole("button", { name: "Mandar o link" });

test("REQ-PWD-002, REQ-PWD-005 e REQ-PWD-011 pede link, limpa token e troca a senha até entrar", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/forgot-password?as=host");
  await expect(page).toHaveTitle("Esqueci a senha · PetHost");
  await expect(page.getByRole("radio", { name: "Anfitrião" })).toHaveAttribute("aria-checked", "true");
  await waitForHydration(sendLinkButton(page));
  await page.getByLabel(/^E-mail da conta/).fill("PESSOA@EXEMPLO.TEST");
  const forgotResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/password/forgot") && response.request().method() === "POST",
  );
  await sendLinkButton(page).click();
  const requested = await forgotResponse;
  expect(requested.status()).toBe(200);
  expect(requested.request().postDataJSON()).toEqual({ email: "pessoa@exemplo.test", role: "host" });
  await expect(page.getByRole("heading", { name: "Olha seu e-mail" })).toBeVisible();
  await expect(
    page.getByText("Se existir uma conta com esse e-mail, o link chega em instantes. Ele vale 30 minutos."),
  ).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/pessoa@exemplo.test/i);

  await page.goto("/reset-password#token=t");
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page).toHaveTitle("Senha nova · PetHost");
  await page.getByLabel(/^Senha nova/).fill("Abcdef1!");
  const resetRequest = page.waitForRequest(
    (request) => request.url().endsWith("/api/auth/password/reset") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Guardar senha nova" }).click();
  expect((await resetRequest).postDataJSON()).toEqual({ token: "t", newPassword: "Abcdef1!" });
  await expect(page.getByRole("heading", { name: "Senha nova guardada" })).toBeFocused();
  await expect(page.getByText("Por segurança, saímos da sua conta em todos os aparelhos.")).toBeVisible();
  await page.getByRole("link", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Entra que a porta tá aberta" })).toBeVisible();
});

test("REQ-PWD-010 link vencido retira o formulário e oferece outro pedido", async ({ page }) => {
  await page.goto("/reset-password#token=expirado");
  await expect(page).toHaveURL(/\/reset-password$/);
  await page.getByLabel(/^Senha nova/).fill("Abcdef1!");
  await page.getByRole("button", { name: "Guardar senha nova" }).click();
  await expect(page.getByText("Esse link já venceu. Pede outro, leva um minuto.")).toBeVisible();
  await expect(page.getByLabel(/^Senha nova/)).toHaveCount(0);
  await page.getByRole("link", { name: "Pedir um link novo" }).click();
  await expect(page).toHaveURL(/\/forgot-password$/, { timeout: 15_000 });
});

test("REQ-PWD-013 e REQ-PWD-014 páginas não indexam e resposta de reset protege o referrer", async ({ page }) => {
  await page.goto("/forgot-password");
  await expect(page).toHaveTitle("Esqueci a senha · PetHost");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const response = await page.goto("/reset-password?token=t");
  expect(response?.headers()["referrer-policy"]).toBe("no-referrer");
  await expect(page).toHaveURL(/\/reset-password$/);
  await expect(page).toHaveTitle("Senha nova · PetHost");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
});

for (const as of ["invalido", "owner", "host", "admin"]) {
  test(`REQ-PWD-001 página interpreta as=${as}`, async ({ page }) => {
    await page.goto(`/forgot-password?as=${as}`);
    if (as === "admin") {
      await expect(page.getByRole("heading", { name: "Esqueceu a senha? Acontece." })).toBeVisible();
      await expect(page.getByRole("radiogroup")).toHaveCount(0);
      await waitForHydration(sendLinkButton(page));
      await page.getByLabel(/^E-mail da conta/).fill("admin@exemplo.test");
      const request = page.waitForRequest((request) => request.url().endsWith("/api/auth/password/forgot"));
      await sendLinkButton(page).click();
      expect((await request).postDataJSON()).toEqual({ email: "admin@exemplo.test", role: "admin" });
      await expect(page.getByRole("heading", { name: "Olha seu e-mail" })).toBeVisible();
    } else {
      await expect(page.getByRole("radio", { name: as === "host" ? "Anfitrião" : "Tutor" })).toHaveAttribute(
        "aria-checked",
        "true",
      );
    }
  });
}
