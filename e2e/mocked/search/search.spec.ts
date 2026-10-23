import { expect, test } from "@playwright/test";
import { pickDates } from "../../support/calendar";
import { loginAccount } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
import { openSearch } from "../../support/search";

test("071 faixa única e chips em 1440 e 390", async ({ page, baseURL }, testInfo) => {
  await loginAccount(page, baseURL!);
  const width = testInfo.project.name.includes("mobile") ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/search?where=Maring%C3%A1&pets=0199d2a0-0000-7000-8000-0000000000e1");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("13 casas com vaga perto de Maringá");
  await expect(page.getByRole("button", { name: "Combina com Luna" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Bairro (opcional)")).toHaveCount(0);
  await expect(page.getByLabel("Diária máxima (R$)")).toHaveCount(0);
  await expect(page.getByText("Conversa antes · Foto todo dia · Pagamento guardado")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/search-071-${width}.png`, fullPage: true });
});

test("REQ-SRCH-001 visitante preserva a busca no login", async ({ page }) => {
  await page.goto("/search?where=Maring%C3%A1&hasKids=false");
  // Primeira visita da execução: o `next dev` ainda compila o redirect e o /login.
  await expect(page).toHaveURL(/\/login\?next=/, { timeout: 15_000 });
  const next = new URL(page.url()).searchParams.get("next")!;
  expect(new URL(next, "http://test").searchParams.get("where")).toBe("Maringá");
  expect(next).toContain("hasKids=false");
});

test("REQ-SRCH-002/005/006/009/010 filtros, mais resultados, histórico e recarga", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/search");
  const list = page.getByRole("list", { name: "Buscar cantinhos" });
  await expect(list.getByRole("link")).toHaveCount(12);
  await waitForHydration(page.getByRole("button", { name: "Mostrar mais cantinhos" }));
  await page.getByRole("button", { name: "Mostrar mais cantinhos" }).click();
  await expect(list.getByRole("link")).toHaveCount(13);
  await page.getByRole("button", { name: "Casa com quintal", exact: true }).click();
  await expect(page).toHaveURL(/hasYard=true/);
  await expect(list.getByRole("link")).toHaveCount(7);
  await page.reload();
  await expect(page.getByRole("button", { name: "Casa com quintal", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(list.getByRole("link")).toHaveCount(7);
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(list.getByRole("link")).toHaveCount(12);
  await page.goBack();
  await expect(page.getByRole("button", { name: "Casa com quintal", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("REQ-SRCH-003/004/007 datas, pets e total seguem no link", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/search");
  await openSearch(page);
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
  const from = tomorrow.toISOString().slice(0, 10);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 5);
  const to = tomorrow.toISOString().slice(0, 10);
  await pickDates(page, page.getByLabel("Chegada", { exact: true }).filter({ visible: true }), from, to);
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Luna", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("casas com vaga perto");
  await expect(page.getByRole("button", { name: "Combina com Luna" })).toHaveAttribute("aria-pressed", "true");
  const card = page.getByRole("list", { name: "Buscar cantinhos" }).getByRole("link").first();
  await expect(card).toContainText(/300,00 as 5 noites/);
  expect(await card.getAttribute("href")).toContain(`from=${from}`);
  expect(await card.getAttribute("href")).toContain("pets=0199d2a0-0000-7000-8000-0000000000e1");
});

test("REQ-SRCH-010/011/012 vazio, endereço e erro por campo", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/search?radius=50&where=Curitiba");
  await expect(page.getByText("Nenhum cantinho por aqui com esses filtros.")).toBeVisible();
  await expect(page.getByText("Tenta outras datas ou tira um filtro.")).toBeVisible();
  await page.goto("/search?where=Sem+endere%C3%A7o");
  await expect(page.getByRole("link", { name: "Conferir meu endereço" })).toBeVisible();
  await page.goto("/search?where=Inv%C3%A1lida");
  await openSearch(page);
  await expect(page.getByLabel("Onde", { exact: true }).filter({ visible: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});

test("REQ-SRCH-003 anfitrião busca sem usar pets residentes", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/search");
  await openSearch(page);
  await expect(page.getByRole("combobox", { name: "Pet" })).toBeVisible();
  await expect(page.getByLabel("Luna", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/count=1/);
});

test("REQ-SRCH-008 lista fica visível enquanto o filtro busca", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/search");
  const list = page.getByRole("list", { name: "Buscar cantinhos" });
  await expect(list.getByRole("link")).toHaveCount(12);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/listings?**", async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await page.getByRole("button", { name: "Casa com quintal", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Farejando cantinhos…" })).toBeVisible();
    await expect(list.getByRole("link")).toHaveCount(12);
  } finally {
    release();
  }
  await expect(list.getByRole("link")).toHaveCount(7);
});
