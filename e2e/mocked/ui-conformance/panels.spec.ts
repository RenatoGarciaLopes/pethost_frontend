import { mkdir } from "node:fs/promises";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { accountFixture, loginAccount, mockProfileImage, resetAccountMock } from "../../support/account";
import { hideDevIndicator } from "../../support/devIndicator";
import { waitForHydration } from "../../support/hydration";
import { mockViaCep } from "../../support/registration";

const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const LUNA = "0199d2a0-0000-7000-8000-0000000000e1";

test.beforeEach(async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: info.project.use.isMobile ? 390 : 1440, height: info.project.use.isMobile ? 844 : 1000 });
  await hideDevIndicator(page);
  await mockProfileImage(page);
  await mockViaCep(page);
  await page.route("https://viacep.com.br/ws/01001000/**", (route) => route.fulfill({ json: {
    cep: "01001-000", logradouro: "Rua de Teste", bairro: "Centro", localidade: "São Paulo", uf: "SP",
  } }));
  await resetAccountMock(page);
});

async function ready(page: Page, route: string) {
  await page.goto(route);
  const main = page.getByRole("main");
  await expect(main).toHaveCount(1);
  await expect(main.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 30_000 });
  await waitForHydration(main);
  await expect(main.locator('.MuiSkeleton-root, [aria-busy="true"]').filter({ visible: true })).toHaveCount(0, { timeout: 30_000 });
  await expect.poll(() => main.evaluate((root) => [...root.querySelectorAll<HTMLElement>('div[style]')]
    .filter((element) => element.style.opacity !== "" && element.getClientRects().length > 0)
    .every((element) => getComputedStyle(element).opacity === "1"))).toBe(true);
  await page.evaluate(async () => { await document.fonts.ready; });
  expect(new URL(page.url()).pathname).toBe(route.split("?")[0]);
}

async function capture(page: Page, name: string, info: TestInfo) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  const surfaces = await page.getByRole("main").locator("[data-surface]").evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return { radius: style.borderRadius, border: style.borderTopWidth, shadow: style.boxShadow };
  }));
  for (const surface of surfaces) {
    expect(surface.radius).toBe("24px");
    expect(surface.border).toBe("2px");
    expect(surface.shadow).not.toBe("none");
  }
  const folder = `test-results/panels/${info.project.use.isMobile ? "mobile" : "desktop"}`;
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: `${folder}/${name}.png`, fullPage: true, animations: "disabled", caret: "initial" });
}

for (const route of ["/login", "/admin/login", "/register", "/forgot-password", "/reset-password"]) {
  test(`REQ-UIC-002/004/007/009 entrada ${route}`, async ({ page }, info) => {
    await ready(page, route);
    const main = await page.getByRole("main").boundingBox();
    expect(main!.width).toBeLessThanOrEqual(route === "/login" ? 1200 : 720);
    await capture(page, route.slice(1).replaceAll("/", "-"), info);
  });
}

test("REQ-UIC-002/004/007/009 conta: perfil, senha, pausa e troca sem main duplicado", async ({ page, baseURL }, info) => {
  await loginAccount(page, baseURL!);
  for (const section of ["profile", "password", "deactivate", "switch"]) {
    await ready(page, `/users/${section}`);
    await capture(page, `users-${section}`, info);
  }
});

test("REQ-UIC-002/007/009 pets: grade, ficha legível e campos antes da prévia móvel", async ({ page, baseURL }, info) => {
  await loginAccount(page, baseURL!);
  await ready(page, "/pets");
  const cards = page.getByRole("link", { name: /^Ficha de / });
  await expect(cards).toHaveCount(2);
  const first = await cards.nth(0).boundingBox(), second = await cards.nth(1).boundingBox();
  if (info.project.use.isMobile) expect(second!.y).toBeGreaterThan(first!.y);
  else expect(second!.x).toBeGreaterThan(first!.x);
  await capture(page, "pets", info);
  await ready(page, `/pets/${LUNA}`);
  await expect(page.getByRole("heading", { level: 1, name: "Ficha de Luna" })).toBeVisible();
  await capture(page, "pet-profile", info);
  await ready(page, `/pets/${LUNA}/edit`);
  const heading = page.getByRole("heading", { level: 2, name: "Saúde", exact: true });
  await expect(heading).toHaveCount(1); // a prévia usa h3 nos blocos internos
  if (info.project.use.isMobile) {
    const preview = await page.getByRole("article", { name: "Carteirinha de Luna" }).boundingBox();
    const photos = await page.getByRole("heading", { name: "Fotos", exact: true }).boundingBox();
    expect(preview!.y).toBeGreaterThan(photos!.y);
  }
  await capture(page, "pet-edit", info);
});

for (const role of ["owner", "host"] as const) {
  test(`REQ-UIC-002/007/009 estadias ${role}: grade e detalhe com status/contato`, async ({ page, baseURL }, info) => {
    await loginAccount(page, baseURL!, "both", role);
    const account = accountFixture("both", role);
    let id = "";
    for (let index = 0; index < 3; index++) {
      const response = await page.request.post(`${MOCK}/__e2e/bookings`, { data: {
        [role === "owner" ? "ownerUserId" : "hostUserId"]: account.user.id,
        booking: { status: "confirmed", responseDeadline: null, contact: { phone: "44988887777" } },
      } });
      expect(response.ok()).toBe(true);
      id = (await response.json()).id;
    }
    await ready(page, `/${role}/bookings${role === "host" ? "?aba=proximas" : ""}`);
    const cards = role === "owner" ? page.getByRole("list", { name: "Estadias" }).getByRole("listitem") : page.getByRole("article");
    await expect(cards).toHaveCount(3);
    const first = await cards.nth(0).boundingBox(), second = await cards.nth(1).boundingBox();
    if (info.project.use.isMobile) expect(second!.y).toBeGreaterThan(first!.y);
    else expect(second!.x).toBeGreaterThan(first!.x);
    await capture(page, `${role}-bookings`, info);
    await ready(page, `/${role}/bookings/${id}`);
    await expect(page.getByRole("list", { name: "Andamento da estadia" })).toBeVisible();
    await expect(page.getByText(/44988887777|\(44\) 98888-7777/)).toBeVisible();
    await capture(page, `${role}-booking`, info);
  });
}

test("REQ-UIC-002/004/007/009 recebimentos: situação legível sem iniciar Stripe", async ({ page, baseURL }, info) => {
  await loginAccount(page, baseURL!, "both", "host");
  await ready(page, "/host/payments");
  await capture(page, "host-payments", info);
});
