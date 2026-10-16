import { expect, test } from "@playwright/test";

test("REQ-AUTH-003 valida campos sem chamar login", async ({ page }) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/auth/sessions/login")) requests += 1;
  });
  await page.goto("/login");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page.getByText("Falta o e-mail.", { exact: true })).toBeVisible();
  await expect(page.getByText("Falta a senha.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("E-mail", { exact: false })).toHaveAttribute("aria-invalid", "true");
  expect(requests).toBe(0);
});

test("REQ-AUTH-007 conta errada mantém email, limpa senha e foca aviso", async ({ page }) => {
  await page.goto("/login?as=host");
  await expect(page.getByRole("radio", { name: "Sou anfitrião" })).toBeChecked();
  await page.getByLabel("E-mail", { exact: false }).fill("tutora@pethost.test");
  await page.getByLabel(/^Senha/).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const alert = page.getByRole("main").getByRole("alert");
  await expect(alert).toContainText("E-mail ou senha não batem com essa conta.");
  await expect(alert).toBeFocused();
  await expect(page.getByLabel("E-mail", { exact: false })).toHaveValue("tutora@pethost.test");
  await expect(page.getByLabel(/^Senha/)).toHaveValue("");
  await expect(page).toHaveURL(/\/login\?as=host$/);
  expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("pethost_"))).toEqual([]);
});

test("REQ-AUTH-004/005/018 login pelo formulário normaliza email e segue next seguro", async ({ page, baseURL }) => {
  await page.goto("/login?next=%2Flogin%3Fnext%3D%252F");
  await page.getByLabel("E-mail", { exact: false }).fill(" TUTORA@PETHOST.TEST ");
  await page.getByLabel(/^Senha/).fill("senha-de-teste");
  const requestPromise = page.waitForRequest(
    (request) => request.method() === "POST" && request.url().endsWith("/api/auth/sessions/login"),
  );
  const destinationPromise = page.waitForRequest((request) => {
    const url = new URL(request.url());
    return url.pathname === "/login" && url.searchParams.get("next") === "/";
  });
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  const request = await requestPromise;
  expect(request.postDataJSON()).toEqual({ email: "tutora@pethost.test", password: "senha-de-teste", role: "owner" });
  expect(new URL((await destinationPromise).url()).searchParams.get("next")).toBe("/");
  // /login já com sessão redireciona no servidor para next=/.
  await expect(page).toHaveURL(`${baseURL}/`, { timeout: 15_000 });
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "pethost_at")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "pethost_rt")?.httpOnly).toBe(true);
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/pethost_(at|rt)/);
});

test("REQ-AUTH-006 login ignora next externo", async ({ page, baseURL }) => {
  await page.goto("/login?next=https%3A%2F%2Foutside.test");
  await page.getByLabel("E-mail", { exact: false }).fill("tutora@pethost.test");
  await page.getByLabel(/^Senha/).fill("senha-de-teste");
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/`, { timeout: 15_000 });
});

test("REQ-AUTH-016/021 cena preserva foco e movimento reduzido deixa pólen parado", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/login");
  const email = page.getByLabel("E-mail", { exact: false });
  await email.focus();
  const scene = page.locator('svg[viewBox="0 0 360 300"]');
  await expect(scene).toHaveAttribute("focusable", "false");
  await expect(scene.locator("..")).toHaveAttribute("aria-hidden", "true");
  await scene.locator('rect[x="138"]').click({ force: true });
  await expect(email).toBeFocused();
  const pollen = scene.locator('circle[cx="92"]');
  await expect(pollen).toHaveCSS("opacity", "1");
  await expect(pollen).toHaveCSS("transform", "none");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
