import { expect, test } from "@playwright/test";

/**
 * Sessão de ponta a ponta no Next real contra o backend simulado (spec 003).
 * REQ-HTTP-007, 010, 012, 013, 015, 016 e 017.
 */
const appHeaders = (baseURL: string) => ({ origin: baseURL, "x-pethost-request": "1" });
const demo = { email: "tutora@pethost.test", password: "senha-de-teste", role: "owner" };

test("login grava cookies HttpOnly, o proxy usa a sessão e o logout encerra", async ({ page, baseURL }) => {
  const login = await page.request.post("/api/auth/sessions/login", { data: demo, headers: appHeaders(baseURL!) });
  const loginBody = await login.json();

  expect(login.status()).toBe(200);
  expect(loginBody.data).toEqual({ user: expect.objectContaining({ email: demo.email }) });
  expect(JSON.stringify(loginBody)).not.toMatch(/accessToken|refreshToken/);

  const cookies = await page.context().cookies();
  const access = cookies.find((cookie) => cookie.name === "pethost_at");
  const refresh = cookies.find((cookie) => cookie.name === "pethost_rt");
  expect(access?.httpOnly).toBe(true);
  expect(access?.sameSite).toBe("Lax");
  expect(refresh?.path).toBe("/api");

  const me = await page.request.get("/api/users/me");
  expect(me.status()).toBe(200);
  expect((await me.json()).data.email).toBe(demo.email);

  // O JavaScript da página não enxerga os tokens.
  await page.goto("/");
  expect(await page.evaluate(() => document.cookie)).not.toMatch(/pethost_(at|rt)/);

  const logout = await page.request.post("/api/auth/sessions/logout", { headers: appHeaders(baseURL!) });
  expect(logout.status()).toBe(200);
  expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("pethost_"))).toEqual([]);
  expect((await page.request.get("/api/users/me")).status()).toBe(401);
});

test("credencial errada não grava cookie e devolve o código da API", async ({ page, baseURL }) => {
  const response = await page.request.post("/api/auth/sessions/login", {
    data: { ...demo, password: "errada" },
    headers: appHeaders(baseURL!),
  });

  expect(response.status()).toBe(401);
  expect((await response.json()).error.code).toBe("AUTH_INVALID_CREDENTIALS");
  expect(await page.context().cookies()).toEqual([]);
});

test("mutação sem o cabeçalho do app é recusada (CSRF)", async ({ page }) => {
  const response = await page.request.post("/api/auth/sessions/login", { data: demo });

  expect(response.status()).toBe(403);
  expect((await response.json()).error.code).toBe("CSRF_REJECTED");
});

test("Server Component com access vencido passa pelo refresh e volta ao next", async ({ page, request, baseURL }) => {
  const mockURL = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
  const seeded = await request.post(`${mockURL}/__e2e/refresh-token`);
  const { refreshToken } = await seeded.json();
  const host = new URL(baseURL!).hostname;
  await page
    .context()
    .addCookies([
      { name: "pethost_rt", value: refreshToken, domain: host, path: "/api", httpOnly: true, sameSite: "Lax" },
    ]);

  await page.goto("/api/auth/sessions/refresh?next=%2F");

  await expect(page).toHaveURL(`${baseURL}/`);
  const names = (await page.context().cookies()).map((cookie) => cookie.name);
  expect(names).toEqual(expect.arrayContaining(["pethost_at", "pethost_rt"]));
});

test("refresh vencido vai para o login com next e apaga os cookies", async ({ page, baseURL }) => {
  const host = new URL(baseURL!).hostname;
  await page
    .context()
    .addCookies([
      { name: "pethost_rt", value: "rt-vencido", domain: host, path: "/api", httpOnly: true, sameSite: "Lax" },
    ]);

  const response = await page.request.get("/api/auth/sessions/refresh?next=%2Fpets", { maxRedirects: 0 });

  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe(`${baseURL}/login?next=%2Fpets`);
  expect((await page.context().cookies()).filter((cookie) => cookie.name.startsWith("pethost_"))).toEqual([]);
});
