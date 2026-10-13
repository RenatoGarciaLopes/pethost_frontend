import { expect, test } from "@playwright/test";
import { loginAccount, mockProfileImage, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
test.beforeEach(async ({ page }) => {
  await resetAccountMock(page);
});
test("REQ-ACC-004/006/012 tutor guarda telefone e endereço e vê confirmação", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  const phone = page.getByLabel(/^Celular com DDD/);
  await waitForHydration(phone);
  await phone.fill("11999999999");
  await page.getByLabel(/^Número/).fill("25");
  const saved = page.waitForResponse(
    (response) => response.url().endsWith("/api/owners/me") && response.request().method() === "PATCH",
  );
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  expect((await saved).status()).toBe(200);
  await expect(page.getByText("Pronto, guardado.")).toBeVisible({ timeout: 15_000 });
  await page.reload();
  await expect(phone).toHaveValue("(11) 99999-9999");
  await expect(page.getByLabel(/^Número/)).toHaveValue("25");
});
test("REQ-ACC-005 tutor sem pagamento confirma CPF com a senha atual", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "single");
  await page.goto("/users/profile");
  await waitForHydration(page.getByLabel(/^Seu nome completo/));
  await page.getByRole("button", { name: "Mostrar", exact: true }).click();
  await page.getByLabel(/^CPF/).fill("12345678909");
  const password = page.getByLabel(/^Sua senha atual/);
  await expect(password).toBeVisible();
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Falta sua senha atual.")).toBeVisible();
  await password.fill("senha-de-teste");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByText("Pronto, guardado.")).toBeVisible();
  await expect(page.getByLabel(/^CPF/)).toHaveValue("123.456.789-09");
});
test("REQ-ACC-007 tutor pago descobre trava de CPF sem perder as outras mudanças", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  await waitForHydration(page.getByLabel(/^Seu nome completo/));
  await page.getByRole("button", { name: "Mostrar", exact: true }).click();
  await page.getByLabel(/^CPF/).fill("12345678909");
  await page.getByLabel(/^Sua senha atual/).fill("senha-de-teste");
  await page.getByLabel(/^Celular com DDD/).fill("11999999999");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  await expect(page.getByLabel(/^CPF/)).toHaveAttribute("readonly", "");
  await expect(
    page.getByText("Depois do primeiro pagamento, o CPF e o nascimento ficam travados. Pra mudar, fala com o suporte."),
  ).toBeVisible();
  await expect(page.getByLabel(/^Celular com DDD/)).toHaveValue("(11) 99999-9999");
});
test("REQ-ACC-009/013 anfitrião verificado lê a identidade travada", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/users/profile");
  await expect(page.getByLabel(/^Seu nome completo/)).toHaveAttribute("readonly", "");
  await expect(page.getByLabel(/^Quando você nasceu/)).toHaveAttribute("readonly", "");
  await expect(page.getByLabel(/^Seu nome completo/)).toHaveAccessibleDescription(
    "Esses dados foram conferidos na verificação. Pra mudar, fala com o suporte.",
  );
  await expect(page.getByLabel(/^Celular com DDD/)).toBeEditable();
  const reveal = page.getByRole("button", { name: "Mostrar", exact: true });
  await waitForHydration(reveal);
  await reveal.click();
  await expect(page.getByLabel(/^CPF/)).toHaveValue("529.982.247-25");
  await page.getByRole("button", { name: "Esconder", exact: true }).click();
  await expect(page.getByLabel(/^CPF/)).toHaveValue("***.***.247-25");
});
test("REQ-ACC-011 anfitrião sem aprovação fica só para leitura", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "unverified", "host");
  await page.goto("/users/profile");
  await expect(page.getByRole("link", { name: "Ir pra verificação" })).toHaveAttribute("href", "/host/application");
  await expect(page.getByLabel(/^Seu nome completo/)).toHaveAttribute("readonly", "");
  await expect(page.getByRole("button", { name: "Salvar", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Trocar foto")).toHaveCount(0);
  await expect(page.getByText(/No PetHost desde/)).toHaveCount(0);
});
test("REQ-ACC-014/015/016 tutor envia e remove a foto com confirmação", async ({ page, baseURL }) => {
  const image = await mockProfileImage(page);
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  const input = page.getByLabel("Trocar foto");
  await waitForHydration(input);
  await input.setInputFiles({ name: "foto.png", mimeType: "image/png", buffer: image });
  await expect(page.getByAltText("Prévia da sua foto")).toBeVisible();
  await page.getByRole("button", { name: "Usar esta foto" }).click();
  await expect(page.getByAltText("Sua foto do perfil")).toBeVisible();
  await page.getByRole("button", { name: "Tirar foto" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Tirar", exact: true }).click();
  await expect(page.getByAltText("Sua foto do perfil")).toHaveCount(0);
});
