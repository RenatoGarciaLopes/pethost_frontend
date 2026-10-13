import { expect, test, type Page } from "@playwright/test";
import { switchAccounts } from "../../support/handlers/switchAccounts.mjs";
import { waitForHydration } from "../../support/hydration";

async function login(page: Page, baseURL: string, scenario = "both", role = "owner") {
  const account = switchAccounts.find((item) => item.scenario === scenario && item.user.role === role)!;
  expect(account).toBeDefined();
  const response = await page.request.post("/api/auth/sessions/login", {
    headers: { origin: baseURL, "x-pethost-request": "1" },
    data: { email: account.user.email, password: account.password, role: account.user.role },
  });
  expect(response.status()).toBe(200);
}

test("REQ-SWITCH-005/006/009 tutor troca para anfitrião com cookies novos HttpOnly", async ({ page, baseURL }) => {
  await login(page, baseURL!);
  const previous = await page.context().cookies();
  await page.goto("/users/switch");
  const password = page.getByLabel(/^Senha da conta de anfitrião/);
  await waitForHydration(password);
  const target = switchAccounts.find((account) => account.scenario === "both" && account.user.role === "host")!;
  await password.fill(target.password);
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith("/api/auth/sessions/switch") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Entrar na conta de anfitrião" }).click();
  expect((await responsePromise).status()).toBe(200);
  await expect(page).toHaveURL(`${baseURL}/host`, { timeout: 15_000 });
  const next = await page.context().cookies();
  for (const name of ["pethost_at", "pethost_rt"]) {
    const cookie = next.find((item) => item.name === name);
    expect(cookie?.httpOnly).toBe(true);
    // Comparação booleana para não imprimir valores de cookies em falhas.
    expect(cookie?.value !== previous.find((item) => item.name === name)?.value).toBe(true);
  }
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/pethost_(at|rt)/);
  const me = await page.request.get("/api/users/me");
  expect((await me.json()).data.role).toBe("host");
});

test("REQ-SWITCH-007 senha errada mostra frase neutra no campo vazio e focado", async ({ page, baseURL }) => {
  await login(page, baseURL!);
  await page.goto("/users/switch");
  const password = page.getByLabel(/^Senha da conta de anfitrião/);
  await waitForHydration(password);
  await password.fill("senha errada");
  await page.getByRole("button", { name: "Entrar na conta de anfitrião" }).click();
  await expect(page.getByText("Não deu pra abrir a outra conta. Confere a senha dela.")).toBeVisible();
  await expect(password).toHaveValue("");
  await expect(password).toBeFocused();
  await expect(page.getByText(/ainda não tem conta/)).toHaveCount(0);
});

test("REQ-SWITCH-003 conta única oferece cadastro da outra conta", async ({ page, baseURL }) => {
  await login(page, baseURL!, "single");
  await page.goto("/users/switch");
  await expect(page.getByText("Você ainda não tem conta de anfitrião.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar conta de anfitrião" })).toHaveAttribute("href", "/register/host");
  await expect(page.getByLabel(/^Senha da conta/)).toHaveCount(0);
});

test("REQ-SWITCH-003 conta de destino pausada oferece reativação no login", async ({ page, baseURL }) => {
  await login(page, baseURL!, "paused");
  await page.goto("/users/switch");
  await expect(page.getByText("Sua conta de anfitrião está pausada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar pra reativar" })).toHaveAttribute("href", "/login?as=host");
});

test("REQ-SWITCH-011/012 destino inválido usa outra conta, título correto e noindex", async ({ page, baseURL }) => {
  await login(page, baseURL!);
  await page.goto("/users/switch?to=invalido");
  await expect(page.getByLabel(/^Senha da conta de anfitrião/)).toBeVisible();
  await expect(page).toHaveTitle("Trocar de conta · PetHost");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("REQ-SWITCH-001 admin é redirecionado para a casa dele", async ({ page, baseURL }) => {
  await login(page, baseURL!, "admin", "admin");
  await page.goto("/users/switch");
  await expect(page).toHaveURL(`${baseURL}/admin/host-applications`);
});
