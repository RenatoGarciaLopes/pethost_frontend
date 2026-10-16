import { expect, test } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../support/account";
import { waitForHydration } from "../support/hydration";

test.beforeEach(async ({ page }) => {
  await resetAccountMock(page);
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-UIC-003 host header has fixed height and one most-specific active shortcut", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/host");
  const header = page.getByRole("banner");
  const expectedHeight = (page.viewportSize()?.width ?? 1440) < 900 ? 56 : 64;
  await expect(header).toHaveCSS("height", `${expectedHeight}px`);
  await expect(header.getByRole("link", { name: "PetHost" })).toHaveCount(1);

  const primaryNav = async () => {
    if ((page.viewportSize()?.width ?? 1440) < 900) {
      await header.getByRole("button", { name: "Abrir a navegação" }).click();
    }
    return page.getByRole("navigation", { name: "Navegação principal" });
  };

  let nav = await primaryNav();
  let links = nav.getByRole("link");
  await expect(links.nth(0)).toHaveAccessibleName("Painel");
  await expect(links.nth(0)).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.goto("/host/application");
  nav = await primaryNav();
  links = nav.getByRole("link");
  await expect(links).toHaveCount(3);
  await expect(nav.getByRole("link", { name: "Minha verificação" })).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
  await page.goto("/host/bookings?aba=pedidos");
  nav = await primaryNav();
  links = nav.getByRole("link");
  await expect(links.first()).toHaveAttribute("aria-current", "page");
  await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
});

test("REQ-SHELL-009/010 visitante entra e volta ao perfil que tentou abrir", async ({ page }) => {
  await page.goto("/users/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fusers%2Fprofile$/);
  const email = page.getByLabel(/^E-mail/);
  await waitForHydration(email);
  await email.fill("tutora@pethost.test");
  await page.getByLabel(/^Senha/).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  // Entrar e abrir o perfil compilam rotas na primeira visita do `next dev` ("Entrando…" ainda na tela aos 5 s).
  await expect(page).toHaveURL(/\/users\/profile$/, { timeout: 15_000 });
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByLabel(/^Seu nome completo/)).toBeVisible();
  await expect(page.getByRole("banner")).toBeVisible();
});

test("REQ-SHELL-009/010 tutor não entra na área do anfitrião", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/host");
  await expect(page).toHaveURL(`${baseURL}/`);
});

test("REQ-SHELL-014 rota inexistente devolve 404 e oferece a casa da conta", async ({ page, baseURL }) => {
  const visitor = await page.goto("/__cantinho_inexistente__");
  expect(visitor?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute("href", "/");
  await loginAccount(page, baseURL!, "both", "host");
  const host = await page.goto("/__cantinho_inexistente__");
  expect(host?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Voltar para o início" })).toHaveAttribute("href", "/host");
});

test("REQ-SHELL-003/004 menu oferece perfil e troca para a outra conta ativa", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/password");
  const menu = page.getByRole("button", { name: /Menu da conta de/ });
  await waitForHydration(menu);
  await menu.click();
  await expect(page.getByText("Conta de tutor", { exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Trocar pra conta de anfitrião" })).toHaveAttribute(
    "href",
    "/users/switch?to=host",
  );
  await page.getByRole("menuitem", { name: "Minha conta" }).click();
  await expect(page).toHaveURL(/\/users\/profile$/);
  await expect(page.getByRole("main")).toHaveCount(1);
});

test("REQ-SHELL-004 conta única não oferece troca", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "single");
  await page.goto("/users/profile");
  const menu = page.getByRole("button", { name: /Menu da conta de/ });
  await waitForHydration(menu);
  const accounts = page.waitForResponse((response) => response.url().endsWith("/api/users/me/accounts"));
  await menu.click();
  expect((await accounts).status()).toBe(200);
  await expect(page.getByRole("menuitem", { name: /Trocar pra/ })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Minha conta" })).toBeVisible();
});

test("REQ-SHELL-005 sair apaga os cookies e impede reabrir a área privada", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  const menu = page.getByRole("button", { name: /Menu da conta de/ });
  await waitForHydration(menu);
  await menu.click();
  await page.getByRole("menuitem", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("pethost_"))).toEqual([]);
  await page.goto("/users/profile");
  await expect(page).toHaveURL(/\/login\?next=%2Fusers%2Fprofile$/);
  await expect(page.getByRole("banner")).toHaveCount(0);
});

test("REQ-SHELL-007 pular para o conteúdo é o primeiro Tab e foca o único main", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/users/profile");
  await waitForHydration(page.getByRole("button", { name: /Menu da conta de/ }));
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Pular para o conteúdo" });
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#conteudo");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(page.getByRole("main")).toBeFocused();
});
