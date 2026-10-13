import { expect, test } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
test.beforeEach(async ({ page }) => {
  await resetAccountMock(page);
});
test("REQ-ACC-018/019 senha nova mantém a sessão e a senha antiga deixa de entrar", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/password");
  const current = page.getByLabel(/^Senha atual/);
  await waitForHydration(current);
  await current.fill("senha-de-teste");
  await page.getByLabel(/^Senha nova/).fill("Nova#senha123");
  await page.getByRole("button", { name: "Trocar senha", exact: true }).click();
  await expect(page.getByText("Senha trocada. Os outros aparelhos saíram da conta.")).toBeVisible();
  expect((await page.request.get("/api/users/me")).status()).toBe(200);
  const account = accountFixture();
  const old = await page.request.post("/api/auth/sessions/login", {
    headers: { origin: baseURL!, "x-pethost-request": "1" },
    data: { email: account.user.email, role: "owner", password: "senha-de-teste" },
  });
  expect(old.status()).toBe(401);
  await loginAccount(page, baseURL!, "both", "owner", "Nova#senha123");
});
test("REQ-ACC-022/024 pausa sai para o aviso fixo e só desativa a conta atual", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/deactivate");
  const checkbox = page.getByRole("checkbox", { name: "Entendi o que acontece" });
  await waitForHydration(checkbox);
  await checkbox.check();
  await page.getByRole("button", { name: "Pausar minha conta" }).click();
  await expect(page).toHaveURL(baseURL + "/login?as=owner&aviso=conta-pausada", { timeout: 15_000 });
  await expect(page.getByText("Sua conta está pausada. Quando quiser voltar, é só entrar.")).toBeVisible();
  expect(
    (await page.context().cookies()).some((cookie) => cookie.name === "pethost_at" || cookie.name === "pethost_rt"),
  ).toBe(false);
  await loginAccount(page, baseURL!, "both", "host");
  const accounts = (await (await page.request.get("/api/users/me/accounts")).json()).data;
  expect(accounts.find((item: { role: string }) => item.role === "owner").isActive).toBe(false);
  expect(accounts.find((item: { role: string }) => item.role === "host").isActive).toBe(true);
});
test("REQ-ACC-026/027 navegação entre perfil, senha e pausa conserva títulos e noindex", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  const destinations = [
    ["Perfil", "Seu perfil · PetHost"],
    ["Senha", "Trocar a senha · PetHost"],
    ["Pausar conta", "Pausar a conta · PetHost"],
  ];
  for (const [label, title] of destinations) {
    await page.getByRole("navigation", { name: "Minha conta" }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveTitle(title);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  }
});
test("REQ-ACC-001 admin é redirecionado nas três páginas pessoais", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "admin", "admin");
  for (const route of ["profile", "password", "deactivate"]) {
    await page.goto("/users/" + route);
    await expect(page).toHaveURL(baseURL + "/admin/host-applications");
  }
});
test("REQ-ACC-024 aviso desconhecido não vira mensagem no login", async ({ page }) => {
  await page.goto("/login?aviso=mensagem-inventada");
  await expect(page.getByLabel(/^E-mail/)).toBeVisible();
  await expect(page.getByText("mensagem-inventada")).toHaveCount(0);
  await expect(page.getByText(/Sua conta está pausada/)).toHaveCount(0);
});
