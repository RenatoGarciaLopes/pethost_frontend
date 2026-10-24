import { expect, test } from "@playwright/test";
import { pickDates } from "../../support/calendar";
import { loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
import { openSearch } from "../../support/search";

// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 15_000 };
// A primeira visita ao cantinho compila a rota e a sessão no `next dev` webpack; leva mais que as outras.
const FIRST_COMPILE = { timeout: 30_000 };
const LISTING_ID = "0199d2a0-0000-7000-8000-000000000042";
const LUNA = "0199d2a0-0000-7000-8000-0000000000e1";
const DAY_MS = 24 * 60 * 60 * 1000;

/** A próxima segunda-feira com pelo menos 4 dias de folga (a API pede 72 h de antecedência), em Brasília (o cantinho do mock não recebe no domingo). */
function nextMonday(): string {
  let day = new Date(Date.now() - 3 * 60 * 60 * 1000 + 4 * DAY_MS);
  while (day.getUTCDay() !== 1) day = new Date(day.getTime() + DAY_MS);
  return day.toISOString().slice(0, 10);
}
const plus = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
const requestPath = (from: string, to: string, pets: string[]) =>
  `/listings/${LISTING_ID}/request?${new URLSearchParams([["from", from], ["to", to], ...pets.map((id) => ["pets", id])])}`;

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page }) => {
  await resetAccountMock(page);
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-REQST-002 a REQ-REQST-006 pede a estadia com o que veio da URL e acompanha em Minhas estadias", async ({
  page,
  baseURL,
}) => {
  // Primeira jornada do arquivo: no `next dev` compila o pedido, as estadias e as rotas do BFF a frio.
  test.setTimeout(60_000);
  await loginAccount(page, baseURL!, "both", "owner");
  const monday = nextMonday();
  await page.goto(requestPath(monday, plus(monday, 2), [LUNA]));

  await expect(page.getByRole("heading", { name: "Pedir estadia", level: 1 })).toBeVisible();
  await expect(page.getByLabel("Chegada e saída")).toHaveValue(/ · 2 noites$/);
  const who = page.getByRole("group", { name: "Quem vai?" });
  await expect(who.getByRole("checkbox", { name: /Luna/ })).toBeChecked();
  await expect(who.getByRole("checkbox", { name: /Thor/ })).not.toBeChecked();
  const summary = page.getByRole("region", { name: "Resumo do pedido" });
  await expect(summary).toContainText("Quintal da Cida");
  await expect(summary).toContainText("Centro, Maringá");
  await expect(summary).toContainText(/R\$\s60,00 × 2 noites × 1 pet = R\$\s120,00/);

  const thor = who.getByRole("checkbox", { name: /Thor/ });
  await waitForHydration(thor);
  await thor.check();
  await expect(summary).toContainText(/× 2 noites × 2 pets = R\$\s240,00/);
  // Troca o período pelo calendário: o resumo refaz a conta com uma noite a mais.
  await pickDates(
    page,
    page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true }),
    monday,
    plus(monday, 3),
  );
  await expect(summary).toContainText(/× 3 noites × 2 pets = R\$\s360,00/);
  await page.getByRole("checkbox", { name: "A ração de costume" }).check();
  await page.getByRole("checkbox", { name: "Os remédios e como dar" }).check();
  await expect(page.getByText("O pedido não segura a vaga: Casa Cida tem até 24 horas pra responder.")).toBeVisible();
  await page.getByRole("button", { name: "Pedir estadia" }).click();

  await expect(page.getByRole("heading", { name: "Pedido enviado!" })).toBeFocused();
  await expect(page.getByText(/^Casa Cida responde até /)).toBeVisible();
  await page.getByRole("link", { name: "Ver minhas estadias" }).click();
  await expect(page).toHaveURL("/owner/bookings", NAVIGATION);
  await expect(page.getByRole("link", { name: /^Quintal da Cida/ })).toContainText("Esperando resposta", NAVIGATION);
});

test("REQ-REQST-002 REQ-REQST-005 da busca ao cantinho e ao pedido, com as datas e o pet da busca", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(90_000);
  await loginAccount(page, baseURL!, "both", "owner");
  const from = nextMonday();
  const to = plus(from, 2);
  await page.goto("/");
  await openSearch(page);
  await pickDates(page, page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true }), from, to);
  // A home já parte com a primeira pet do tutor (Luna) escolhida.
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: /casas com vaga perto/ })).toBeVisible(NAVIGATION);

  const card = page.getByRole("list", { name: "Buscar cantinhos" }).getByRole("link").first();
  // O título já existe antes da busca: espera o card levar as datas e o pet da URL nova, senão o clique abre o
  // cantinho sem eles (corrida vista no E2E da 078).
  await expect(card).toHaveAttribute("href", new RegExp(`pets=.+&from=${from}&to=${to}`), NAVIGATION);
  const title = (await card.getByRole("heading").first().textContent())?.trim() ?? "";
  await expect(card).toHaveAttribute("href", /pets=.+&from=.+&to=.+/);
  await waitForHydration(card);
  await card.click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible(FIRST_COMPILE);

  const ask = page.getByRole("link", { name: "Pedir estadia" });
  await waitForHydration(ask);
  await ask.click();
  await expect(page).toHaveURL(/\/listings\/[0-9a-f-]+\/request\?/, NAVIGATION);
  await expect(page.getByRole("heading", { name: "Pedir estadia", level: 1 })).toBeVisible(NAVIGATION);
  // No celular a busca anterior continua montada e oculta, com os mesmos rótulos.
  await expect(page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true })).toHaveValue(
    / · 2 noites$/,
  );
  await expect(page.getByRole("group", { name: "Quem vai?" }).getByRole("checkbox", { name: /Luna/ })).toBeChecked();
  const summary = page.getByRole("region", { name: "Resumo do pedido" });
  await expect(summary).toContainText(title);
  await expect(summary).toContainText(/R\$\s60,00 × 2 noites × 1 pet = R\$\s120,00/);

  await page.getByRole("checkbox", { name: "A ração de costume" }).check();
  await page.getByRole("checkbox", { name: "Os remédios e como dar" }).check();
  const send = page.getByRole("button", { name: "Pedir estadia" });
  await waitForHydration(send);
  await send.click();
  await expect(page.getByRole("heading", { name: "Pedido enviado!" })).toBeFocused();
});

test("REQ-REQST-007 dia em que o cantinho não recebe vira frase no topo, com o dia", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "owner");
  const saturday = plus(nextMonday(), 5);
  await page.goto(requestPath(saturday, plus(saturday, 2), [LUNA]));
  const send = page.getByRole("button", { name: "Pedir estadia" });
  await waitForHydration(send);
  await page.getByRole("checkbox", { name: "A ração de costume" }).check();
  await page.getByRole("checkbox", { name: "Os remédios e como dar" }).check();
  await send.click();
  const sunday = plus(saturday, 1);
  await expect(
    page.getByText(`O cantinho não recebe em domingo (${sunday.slice(8)}/${sunday.slice(5, 7)}). Tenta outras datas.`),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pedido enviado!" })).toHaveCount(0);
});

test("REQ-REQST-004 REQ-REQST-010 sem marcar ração e remédios a frase aparece e o calendário bloqueia chegada com menos de 72 h", async ({
  page,
  baseURL,
}, testInfo) => {
  await loginAccount(page, baseURL!, "both", "owner");
  const today = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.goto(requestPath(plus(today, 6), plus(today, 8), [LUNA]));
  const send = page.getByRole("button", { name: "Pedir estadia" });
  await waitForHydration(send);
  await send.click();
  await expect(page.getByText("Marca os dois pra confirmar que a ração e os remédios vão junto.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pedido enviado!" })).toHaveCount(0);
  await page.screenshot({ path: `test-results/request-091-erro-${testInfo.project.name}.png`, fullPage: true });
  await page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true }).click();
  const dialog = page.getByRole("dialog", { name: /^Escolher/ });
  await expect(dialog.locator(`[data-iso="${plus(today, 3)}"]`)).toHaveAttribute("aria-disabled", "true");
  await expect(dialog.locator(`[data-iso="${plus(today, 4)}"]`)).not.toHaveAttribute("aria-disabled");
  await page.waitForTimeout(600);
  await page.screenshot({ path: `test-results/request-091-calendario-${testInfo.project.name}.png` });
});

test("REQ-REQST-001 anfitrião vê que pedir é com a conta de tutor e a troca de conta", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto(`/listings/${LISTING_ID}/request`);
  await expect(page.getByText("Pra pedir uma estadia, entra com a conta de tutor.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Trocar de conta" })).toHaveAttribute("href", "/users/switch");
  await expect(page.getByRole("button", { name: "Pedir estadia" })).toHaveCount(0);
});

test("REQ-REQST-001 id que não é de cantinho apresenta o 404 da casca", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "both", "owner");
  await page.goto("/listings/nao-e-um-id/request");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
});

test("REQ-REQST-007 REQ-HTTP-005 a API recusa a antecedência e os termos: as duas frases chegam em português", async ({
  page,
  baseURL,
}, testInfo) => {
  await loginAccount(page, baseURL!, "both", "owner");
  const monday = nextMonday();
  // A tela já impede esses dois erros; a recusa da API (regra mudou, tela antiga aberta) é forçada na rota.
  await page.route("**/api/bookings", async (route) => {
    if (route.request().method() !== "POST") return route.fallback();
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "One or more fields are invalid.",
          details: [
            {
              field: "checkIn",
              messages: ["Check-in must be at least 72 hours ahead."],
              errors: [
                { code: "BOOKING_CHECK_IN_TOO_SOON", params: { minimumHours: 72, responseHours: 24, acceptHours: 48 } },
              ],
            },
            {
              field: "careTermsAccepted",
              messages: ["Confirm that you will bring the pet's food and hand over its medicines to the host."],
              errors: [{ code: "BOOKING_CARE_TERMS_NOT_ACCEPTED" }],
            },
          ],
        },
        timestamp: new Date().toISOString(),
      }),
    });
  });
  await page.goto(requestPath(monday, plus(monday, 2), [LUNA]));
  const checklist = page.getByRole("group", { name: "Combinou de levar?" });
  await waitForHydration(checklist.getByRole("checkbox").first());
  for (const box of await checklist.getByRole("checkbox").all()) await box.check();
  await page.getByRole("button", { name: "Pedir estadia" }).click();

  await expect(
    page.getByText("A chegada precisa ser daqui a pelo menos 3 dias: o anfitrião tem 24 horas pra responder."),
  ).toBeVisible();
  await expect(page.getByText("Marca os dois pra confirmar que a ração e os remédios vão junto.")).toBeVisible();
  await expect(page.getByText(/Check-in must|Confirm that/)).toHaveCount(0);
  await page.screenshot({ path: `test-results/request-090-erros-${testInfo.project.name}.png`, fullPage: true });
});
