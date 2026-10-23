import { expect, test } from "@playwright/test";
import { pickDates } from "../../support/calendar";
import { loginAccount } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
import { openSearch } from "../../support/search";

test("079 resultados e chips na home em 1440 e 390", async ({ page, baseURL }, testInfo) => {
  await loginAccount(page, baseURL!);
  const width = testInfo.project.name.includes("mobile") ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?where=Maring%C3%A1&pets=0199d2a0-0000-7000-8000-0000000000e1");
  await expect(page.getByRole("heading", { level: 1, name: "13 casas com vaga perto de Maringá" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Combina com Luna" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("Bairro (opcional)")).toHaveCount(0);
  await expect(page.getByLabel("Diária máxima (R$)")).toHaveCount(0);
  await expect(page.getByText("Conversa antes · Foto todo dia · Pagamento guardado")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: `test-results/home-079-${width}.png`, fullPage: true });
});

test("REQ-SRCH-013 busca com região mostra o mapa: ao lado da lista no computador, em tela cheia pelo Ver mapa no celular", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name.includes("mobile");
  const width = mobile ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/?where=Maring%C3%A1");
  await expect(page.getByRole("heading", { level: 1, name: "13 casas com vaga perto de Maringá" })).toBeVisible({
    timeout: 30_000,
  });
  const map = page.getByRole("region", { name: "Mapa dos cantinhos" });
  if (mobile) {
    await expect(map).toHaveCount(0);
    const open = page.getByRole("button", { name: "Ver mapa" });
    await waitForHydration(open);
    await open.click();
  }
  await expect(map).toBeVisible({ timeout: 30_000 });
  await expect(map.getByRole("button", { name: /R\$/ }).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("checkbox", { name: "Buscar quando eu mexer no mapa" })).toHaveCount(0);
  if (mobile) {
    await page.getByRole("button", { name: "Ver lista" }).click();
    await expect(map).toHaveCount(0);
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(map).toBeVisible();
  }
  if (!mobile)
    await page.getByRole("heading", { level: 1, name: /casas com vaga perto/ }).evaluate((el) => el.scrollIntoView());
  // Os tiles chegam depois do pino: espera o mapa assentar antes do print.
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `test-results/home-079-mapa-${width}.png` });
});

test("REQ-SRCH-001 visitante busca na própria home, sem passar pelo login", async ({ page }) => {
  await page.goto("/?where=Maring%C3%A1&hasKids=false");
  await expect(page.getByRole("heading", { level: 1, name: "13 casas com vaga perto de Maringá" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page).toHaveURL(/\/\?where=Maring%C3%A1&hasKids=false$/);
  await expect(page.getByRole("button", { name: "Sem criança", exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("REQ-SRCH-002/005/006/009/010 filtros, mais resultados, histórico e recarga", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/?where=Maring%C3%A1");
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
  await page.goto("/");
  await openSearch(page);
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 2);
  const from = tomorrow.toISOString().slice(0, 10);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 5);
  const to = tomorrow.toISOString().slice(0, 10);
  await pickDates(page, page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true }), from, to);
  // A home já parte com a primeira pet do tutor (Luna) escolhida.
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: /casas com vaga perto/ })).toBeVisible();
  await expect(page.getByRole("button", { name: "Combina com Luna" })).toHaveAttribute("aria-pressed", "true");
  const card = page.getByRole("list", { name: "Buscar cantinhos" }).getByRole("link").first();
  await expect(card).toContainText(/300,00 as 5 noites/);
  expect(await card.getAttribute("href")).toContain(`from=${from}`);
  expect(await card.getAttribute("href")).toContain("pets=0199d2a0-0000-7000-8000-0000000000e1");
});

test("REQ-SRCH-010/011/012 vazio, endereço e erro por campo", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/?radius=50&where=Curitiba");
  await expect(page.getByText("Nenhum cantinho por aqui com esses filtros.")).toBeVisible();
  await expect(page.getByText("Tenta outras datas ou tira um filtro.")).toBeVisible();
  await page.goto("/?where=Sem+endere%C3%A7o");
  await expect(page.getByRole("link", { name: "Conferir meu endereço" })).toBeVisible();
  await page.goto("/?where=Inv%C3%A1lida");
  await expect(page.getByRole("alert").filter({ hasText: "Onde:" })).toBeVisible();
});

test("REQ-SRCH-003 anfitrião busca sem usar pets residentes", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/");
  await openSearch(page);
  await expect(page.getByRole("combobox", { name: "Pet" })).toBeVisible();
  await expect(page.getByLabel("Luna", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/count=1/);
});

test("REQ-SRCH-008 lista fica visível enquanto o filtro busca", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/?where=Maring%C3%A1");
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

test("REQ-SRCH-014 resultados trazem a busca minificada no cabeçalho, editável por segmento, e chips verdes", async ({
  page,
  baseURL,
}, testInfo) => {
  await loginAccount(page, baseURL!);
  const mobile = testInfo.project.name.includes("mobile");
  const width = mobile ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto(
    "/?where=Zona+7%2C+Maring%C3%A1&from=2026-12-20&to=2026-12-25&pets=0199d2a0-0000-7000-8000-0000000000e1",
  );
  const summary = page.getByRole("group", { name: "Sua busca" });
  await expect(summary).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("form", { name: "Busca de cantinhos" })).toHaveCount(0);
  await expect(summary.getByRole("button", { name: "Editar o lugar: Zona 7, Maringá" })).toBeVisible();
  await expect(summary.getByRole("button", { name: "Editar as datas: 20 a 25 dez" })).toBeVisible();
  await expect(summary.getByRole("button", { name: "Editar o pet: Luna" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Combina com Luna" })).toHaveCSS(
    "background-color",
    "rgb(197, 219, 79)",
  );
  // Nada no cabeçalho quebra em duas linhas, e os chips ficam na faixa dele, acima da borda.
  await expect(
    page
      .getByRole("link", { name: "Minhas estadias" })
      .or(page.getByRole("button", { name: "Abrir a navegação" }))
      .first(),
  ).toBeVisible();
  const header = page.getByRole("banner");
  await expect(header.getByRole("button", { name: "Combina com Luna" })).toBeVisible();
  if (!mobile)
    expect((await header.getByRole("link", { name: "Como funciona" }).boundingBox())!.height).toBeLessThan(60);
  const map = page.getByRole("region", { name: "Mapa dos cantinhos" });
  await expect(page.getByRole("list", { name: "Buscar cantinhos" }).getByRole("link").first()).toBeVisible({
    timeout: 30_000,
  });
  if (!mobile) {
    await expect(map.getByRole("button", { name: /R\$/ }).first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(4000);
  }
  await page.screenshot({ path: `test-results/home-088-${width}.png` });
  if (mobile) {
    await page.getByRole("button", { name: "Ver mapa" }).click();
    await expect(map.getByRole("button", { name: /R\$/ }).first()).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: "test-results/home-088-mapa-390.png" });
    await page.getByRole("button", { name: "Ver lista" }).click();
  }
  const edit = summary.getByRole("button", { name: /^Editar o lugar/ });
  await waitForHydration(edit);
  await edit.click();
  const where = page.getByRole("textbox", { name: "Onde" });
  await expect(where).toBeFocused();
  await where.fill("Zona 5, Maringá");
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).click();
  await expect(page).toHaveURL(/where=Zona\+5/);
  await expect(summary.getByRole("button", { name: "Editar o lugar: Zona 5, Maringá" })).toBeVisible();
});
