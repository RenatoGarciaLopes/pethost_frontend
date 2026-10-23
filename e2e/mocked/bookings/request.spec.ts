import { expect, test } from "@playwright/test";
import { displayDate, pickDates } from "../../support/calendar";
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

/** A próxima segunda-feira com pelo menos 2 dias de folga, em Brasília (o cantinho do mock não recebe no domingo). */
function nextMonday(): string {
  let day = new Date(Date.now() - 3 * 60 * 60 * 1000 + 2 * DAY_MS);
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
  await expect(page.getByLabel("Chegada")).toHaveValue(displayDate(monday));
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
  // Troca a saída pelo calendário: o resumo refaz a conta com uma noite a mais.
  await pickDates(page, page.getByLabel("Saída", { exact: true }).filter({ visible: true }), plus(monday, 3));
  await expect(summary).toContainText(/× 3 noites × 2 pets = R\$\s360,00/);
  await page.getByRole("checkbox", { name: "A ração de costume" }).check();
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
  await pickDates(page, page.getByLabel("Chegada", { exact: true }).filter({ visible: true }), from, to);
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Luna", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Achar um cantinho", exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole("heading", { level: 2, name: /casas com vaga perto/ })).toBeVisible(NAVIGATION);

  const card = page.getByRole("list", { name: "Buscar cantinhos" }).getByRole("link").first();
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
  await expect(page.getByLabel("Chegada", { exact: true }).filter({ visible: true })).toHaveValue(displayDate(from));
  await expect(page.getByLabel("Saída", { exact: true }).filter({ visible: true })).toHaveValue(displayDate(to));
  await expect(page.getByRole("group", { name: "Quem vai?" }).getByRole("checkbox", { name: /Luna/ })).toBeChecked();
  const summary = page.getByRole("region", { name: "Resumo do pedido" });
  await expect(summary).toContainText(title);
  await expect(summary).toContainText(/R\$\s60,00 × 2 noites × 1 pet = R\$\s120,00/);

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
  await send.click();
  const sunday = plus(saturday, 1);
  await expect(
    page.getByText(`O cantinho não recebe em domingo (${sunday.slice(8)}/${sunday.slice(5, 7)}). Tenta outras datas.`),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pedido enviado!" })).toHaveCount(0);
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
