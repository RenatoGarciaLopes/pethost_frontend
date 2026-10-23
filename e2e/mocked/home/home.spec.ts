import { expect, test, type Page } from "@playwright/test";
import { pickDates } from "../../support/calendar";
import { loginAccount } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
import { hideDevIndicator } from "../../support/devIndicator";

test.setTimeout(60_000);

async function expandSearchOnMobile(page: Page) {
  await waitForHydration(page.getByRole("main"));
  const openSearch = page.getByRole("button", { name: "Onde, datas e pet", exact: true });
  if (await openSearch.isVisible()) await openSearch.click();
}

async function submitSearch(page: Page) {
  const desktopSearch = page.getByRole("button", { name: "Achar um cantinho", exact: true });
  const mobileSearch = page.getByRole("button", { name: "Achar um cantinho", exact: true });
  await ((await desktopSearch.isVisible()) ? desktopSearch : mobileSearch).click();
}

test("REQ-HOME-001/002 visitante vê o início e volta à busca depois de entrar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Início · PetHost");
  await expect(
    page.getByRole("heading", { level: 1, name: "Um quintal pro seu pet enquanto você viaja" }),
  ).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("textbox", { name: "Onde" }).fill("Zona 7");
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Cão", exact: true }).click();
  await submitSearch(page);

  await expect(page).toHaveURL(/\/login\?next=/);
  const next = new URL(page.url()).searchParams.get("next");
  expect(next).toBe("/search?where=Zona+7&species=dog");
});

test("REQ-HOME-003 tutor com pet segue para busca com o id, sem dados do perfil", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Um quintal pra Luna enquanto você viaja" })).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("textbox", { name: "Onde" }).fill("Maringá");
  await submitSearch(page);
  await expect(page).toHaveURL(/\/search\?/, { timeout: 45_000 });
  const params = new URL(page.url()).searchParams;
  expect(params.get("where")).toBe("Maringá");
  expect(params.getAll("pets")).toEqual(["0199d2a0-0000-7000-8000-0000000000e1"]);
  expect(params.has("name")).toBe(false);
});

test("REQ-HOME-002 tutor sem pet escolhe espécie sem convite para cadastro", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "single");
  await page.goto("/");
  await expect(page.getByText("Você pode buscar antes de cadastrar seu pet.")).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Gato", exact: true }).click();
  await submitSearch(page);
  await expect(page).toHaveURL(/\/search\?species=cat$/);
});

test("REQ-HOME-006 celular abre a busca pela pílula acessível", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Onde, datas e pet" });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute("aria-expanded", "false");
  await open.click();
  await expect(page.getByRole("button", { name: "Fechar busca" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("textbox", { name: "Onde" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Achar um cantinho" })).toBeVisible();
});

test("REQ-UIC-002/003/007/009 home tem casa, faixa única, confiança e composição responsiva", async ({
  page,
}, info) => {
  test.setTimeout(90_000);
  const mobile = Boolean(info.project.use.isMobile);
  await page.setViewportSize({ width: mobile ? 390 : 1440, height: mobile ? 844 : 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await hideDevIndicator(page);
  await page.goto("/");
  const main = page.getByRole("main");
  await waitForHydration(main);
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  await expect(main).toHaveCount(1);
  await expect(main.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("banner")).toHaveCSS("border-bottom-width", "2px");
  await expect(page.getByRole("banner")).toHaveCSS("border-bottom-color", "rgb(31, 26, 23)");
  const brandLink = page.getByRole("link", { name: "PetHost", exact: true });
  await expect(brandLink).toHaveCSS("text-decoration-line", "none");
  await expect(brandLink).toHaveCSS("color", "rgb(31, 26, 23)");
  const header = await page.getByRole("banner").boundingBox();
  for (const content of [brandLink.locator("svg"), page.getByRole("link", { name: "Entrar", exact: true })]) {
    const bounds = await content.boundingBox();
    expect(bounds!.y - header!.y).toBeGreaterThanOrEqual(8);
    expect(header!.y + header!.height - (bounds!.y + bounds!.height)).toBeGreaterThanOrEqual(10);
  }
  const scene = main.locator('svg[viewBox="0 0 520 300"]');
  await expect(scene).toBeVisible();
  await expect(scene.locator("canvas")).toHaveCount(2);
  await expect
    .poll(() =>
      scene.locator("canvas").evaluateAll((canvases) =>
        canvases.every((element) => {
          const canvas = element as HTMLCanvasElement;
          const drawing = canvas.getContext("2d")?.getImageData(0, 0, canvas.width, canvas.height).data;
          return drawing?.some((value, index) => index % 4 === 3 && value > 0);
        }),
      ),
    )
    .toBe(true);
  const form = page.getByRole("form", { name: "Busca de cantinhos" });
  await expect(form).toHaveCSS("box-shadow", "rgb(31, 26, 23) 0px 5px 0px 0px");
  const lawn = form.locator("../..");
  await expect(lawn).toHaveCSS("background-color", "rgb(207, 227, 160)");
  await expect(lawn).toHaveCSS("border-bottom-color", "rgb(31, 26, 23)");
  const wave = lawn.locator("svg").first();
  const outline = wave.locator('path[fill="none"]').first();
  await expect(outline).toHaveAttribute("d", /^M0 .*C.*[^Z]$/);
  if (mobile) await page.getByRole("button", { name: "Onde, datas e pet" }).click();
  await page.getByRole("textbox", { name: "Onde" }).fill("Zona 7, Maringá");
  const arrival = new Date(Date.now() + 30 * 86_400_000);
  const departure = new Date(arrival.getTime() + 5 * 86_400_000);
  await pickDates(
    page,
    page.getByLabel("Chegada e saída", { exact: true }),
    arrival.toISOString().slice(0, 10),
    departure.toISOString().slice(0, 10),
  );
  await expect(page.getByText(/ · 5 noites$/)).toBeVisible();
  await expect(form.locator("fieldset")).toHaveCount(0);
  const guarantees = page.getByRole("list", { name: "Garantias da PetHost" }).getByRole("listitem");
  await expect(guarantees).toHaveCount(3);
  const first = await guarantees.nth(0).boundingBox(),
    second = await guarantees.nth(1).boundingBox();
  if (mobile) {
    expect(second!.y).toBeGreaterThan(first!.y);
    await page.getByRole("button", { name: "Fechar busca" }).click();
  } else {
    expect(second!.x).toBeGreaterThan(first!.x);
    const title = await main.getByRole("heading", { level: 1 }).boundingBox();
    const brand = await page.getByRole("link", { name: "PetHost", exact: true }).boundingBox();
    expect(Math.abs(title!.x - brand!.x)).toBeLessThanOrEqual(1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    page.viewportSize()!.width,
  );
  const searchBounds = await form.boundingBox();
  const lawnBounds = await lawn.boundingBox();
  const waveBounds = await wave.boundingBox();
  expect(searchBounds!.y - (waveBounds!.y + (waveBounds!.height * 12) / 28)).toBeGreaterThanOrEqual(24);
  expect(lawnBounds!.y + lawnBounds!.height - (searchBounds!.y + searchBounds!.height + 5)).toBeGreaterThanOrEqual(24);
  await page.getByRole("heading", { level: 1 }).click();
  await page.screenshot({
    path: `test-results/home-fidelity/${mobile ? "mobile" : "desktop"}.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test.describe("vitrine perto de você", () => {
  test.use({ geolocation: { latitude: -23.4273, longitude: -51.9375 }, permissions: ["geolocation"] });

  test("REQ-NEARBY-020 visitante libera a localização e vê cantinhos por perto sem entrar", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page.getByRole("main"));
    // Permissão concedida: a vitrine busca sozinha, sem pedir login e sem pôr a posição na URL.
    await expect(page.getByRole("heading", { level: 2, name: /casas com vaga perto de você$/ })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByRole("list").getByRole("link").first()).toBeVisible();
    expect(page.url()).not.toMatch(/latitude|longitude|-23\.4/);
    await hideDevIndicator(page);
    await page.screenshot({ path: "test-results/home-fidelity/nearby.png", fullPage: true });
  });

  test("REQ-SRCH-020 tutor com pet vê nos cards se o cantinho combina com ele", async ({ page, baseURL }) => {
    await loginAccount(page, baseURL!);
    await page.goto("/");
    await waitForHydration(page.getByRole("main"));
    await expect(page.getByRole("heading", { level: 2, name: /casas com vaga perto de você$/ })).toBeVisible({
      timeout: 45_000,
    });
    await expect(page.getByText("✓ Combina com a Luna").first()).toBeVisible();
    await expect(page.getByText("! Tem gato em casa").first()).toBeVisible();
    await expect(page.getByText("★ 4,8 (9)").first()).toBeVisible();
    await hideDevIndicator(page);
    await page.screenshot({ path: "test-results/home-fidelity/nearby-owner.png", fullPage: true });
  });
});

test.describe("vitrine perto de você sem cantinho no raio", () => {
  // Fortaleza: fora do mapa sintético do mock, então o raio de 10 km vem vazio.
  test.use({ geolocation: { latitude: -3.7319, longitude: -38.5267 }, permissions: ["geolocation"] });

  test("REQ-NEARBY-021 raio vazio mostra os cantinhos sem filtro de lugar", async ({ page }) => {
    const searches: URLSearchParams[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (url.pathname === "/api/listings") searches.push(url.searchParams);
    });
    await page.goto("/");
    await waitForHydration(page.getByRole("main"));
    await expect(page.getByRole("heading", { level: 2, name: "13 casas com vaga para conhecer" })).toBeVisible({
      timeout: 45_000,
    });
    await expect(
      page.getByText("Ainda não achamos cantinhos num raio de 10 km, então mostramos outras casas."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /Quintal 1\b/ })).toBeVisible();
    expect(searches.some((params) => params.has("radiusKm"))).toBe(true);
    expect(searches.some((params) => [...params.keys()].join() === "pageSize")).toBe(true);
    expect(page.url()).not.toMatch(/latitude|longitude|-3\.7/);
  });
});

test("072 mouse fecha Select sem anel na célula; Tab mantém foco em tinta", async ({ page }, info) => {
  await page.setViewportSize({ width: info.project.use.isMobile ? 390 : 1440, height: 960 });
  await page.goto("/");
  await expandSearchOnMobile(page);
  const pet = page.getByRole("combobox", { name: "Pet" });
  const petCell = pet.locator("..").locator("..").locator("..");
  await pet.click();
  await page.getByRole("option", { name: "Cão", exact: true }).click();
  await expect(pet).toBeFocused();
  await expect(pet).toHaveCSS("outline-style", "none");
  await expect(petCell).toHaveCSS("outline-style", "none");
  await page.screenshot({ path: `test-results/072-select-mouse-${info.project.name}.png`, fullPage: true });
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(pet).toBeFocused();
  await expect(pet).toHaveCSS("outline-style", "none");
  await expect(petCell).toHaveCSS("outline-color", "rgb(31, 26, 23)");
  await expect(petCell).toHaveCSS("outline-width", "3px");
  await expect(petCell).toHaveCSS("outline-offset", "3px");
  await expect(petCell).toHaveCSS("border-radius", "12px");
  await page.screenshot({ path: `test-results/072-select-tab-${info.project.name}.png`, fullPage: true });
  await page.keyboard.press("Shift+Tab");
  const dates = page.getByLabel("Chegada e saída", { exact: true });
  await expect(dates).toBeFocused();
  await expect(dates.locator("..")).toHaveCSS("outline-color", "rgb(31, 26, 23)");
  await expect(dates.locator("..")).toHaveCSS("outline-width", "3px");
});
