import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 15_000 };
const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const owner = accountFixture("both", "owner");
const DAY_MS = 24 * 60 * 60 * 1000;

/** Data em Brasília daqui a `days` dias (AAAA-MM-DD). */
const inDays = (days: number) => new Date(Date.now() - 3 * 60 * 60 * 1000 + days * DAY_MS).toISOString().slice(0, 10);

const CASA = {
  listing: {
    id: "0199e0a0-0000-7000-8000-0000000000c1",
    title: "Casa da Cida",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
  host: { id: "0199e0a0-0000-7000-8000-0000000000b1", name: "Aparecida Souza", avatarUrl: null },
};
const HOST_CONTACT = {
  phone: "44988887777",
  address: {
    zipCode: "87020000",
    street: "Avenida Brasil",
    number: "120",
    complement: "Casa 2",
    neighborhood: "Zona 01",
    city: "Maringá",
    state: "PR",
  },
};

/** Semeia uma estadia do tutor (a 050, que cria pedidos, ainda não existe). */
async function seedStay(page: Page, booking: Record<string, unknown> = {}) {
  const response = await page.request.post(`${MOCK}/__e2e/bookings`, {
    data: { ownerUserId: owner.user.id, booking: { ...CASA, ...booking } },
  });
  expect(response.ok()).toBe(true);
  return (await response.json()) as { id: string };
}

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "both", "owner");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-STAYS-001 a REQ-STAYS-005 da lista à estadia confirmada, com a trilha e o contato do anfitrião", async ({
  page,
}) => {
  await seedStay(page, { status: "confirmed", responseDeadline: null, contact: HOST_CONTACT });
  await page.goto("/owner/bookings");
  await expect(page.getByRole("heading", { name: "Suas viagens e as deles.", level: 1 })).toBeVisible();
  await expect(page.getByRole("main").getByText("Minhas estadias", { exact: true })).toBeVisible();

  const stay = page
    .getByRole("list", { name: "Estadias" })
    .getByRole("link", { name: "Pipoca na casa de Aparecida Souza" });
  await expect(stay.locator("xpath=ancestor::li")).toContainText("Confirmada");
  await waitForHydration(stay);
  await stay.click();
  await expect(page).toHaveURL(/\/owner\/bookings\/[0-9a-f-]+$/, NAVIGATION);

  await expect(page.getByRole("heading", { name: "Pipoca na casa de Aparecida Souza", level: 1 })).toBeVisible(
    NAVIGATION,
  );
  const trail = page.getByRole("list", { name: "Andamento da estadia" });
  await expect(trail).toBeVisible();
  await expect(trail.getByRole("listitem").nth(1)).toHaveAttribute("aria-current", "step");
  await expect(page.getByRole("region", { name: "Resumo" })).toContainText("R$ 60,00 × 5 noites × 1 pet");
  const contact = page.getByRole("region", { name: "Contato do anfitrião" });
  await expect(contact.getByRole("link", { name: "(44) 98888-7777" })).toHaveAttribute("href", "tel:44988887777");
  await expect(contact).toContainText("Avenida Brasil, 120, Casa 2");
});

test("REQ-STAYS-004 pedido esperando: prazo do anfitrião e nenhum contato", async ({ page }) => {
  const stay = await seedStay(page, { contact: HOST_CONTACT });
  await page.goto(`/owner/bookings/${stay.id}`);
  await expect(page.getByText(/^Aparecida Souza responde até/)).toBeVisible();
  await expect(page.getByText("Esperando resposta").first()).toBeVisible();
  await expect(page.getByRole("region", { name: "Contato do anfitrião" })).toHaveCount(0);
});

test("REQ-STAYS-006 REQ-STAYS-007 cancela a estadia confirmada com motivo e vê o reembolso; ela aparece como cancelada na lista", async ({
  page,
}) => {
  const stay = await seedStay(page, {
    status: "confirmed",
    responseDeadline: null,
    contact: HOST_CONTACT,
    checkIn: inDays(10),
    checkOut: inDays(14),
  });
  await page.goto(`/owner/bookings/${stay.id}`);
  const open = page.getByRole("button", { name: "Cancelar estadia" });
  await waitForHydration(open);
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Cancelar a estadia?" });
  // O diálogo foca a ação segura ao terminar de abrir; só então a pessoa vai ao campo.
  await expect(dialog.getByRole("button", { name: "Manter estadia" })).toBeFocused();
  await dialog.getByRole("textbox", { name: "Motivo (opcional)" }).fill("Mudança de planos");
  await dialog.getByRole("button", { name: "Cancelar estadia" }).click();

  await expect(page.getByText("Estadia cancelada.")).toBeVisible();
  await expect(page.getByText("Reembolso de 100%")).toBeVisible();
  await expect(page.getByRole("region", { name: "Contato do anfitrião" })).toHaveCount(0);

  await page.goto("/owner/bookings");
  const card = page.getByRole("list", { name: "Estadias" }).getByRole("listitem");
  await expect(card).toContainText("Cancelada");
  await expect(card).toContainText("Estadia cancelada. Reembolso de 100%.");
  await expect(card.getByRole("link", { name: "Buscar outro cantinho" })).toHaveAttribute("href", "/");
});

test("REQ-STAYS-010 a lista única põe o que falta pagar primeiro, com 'Pagar' e o total, e leva à busca nas expiradas", async ({
  page,
}) => {
  const MINUTE_MS = 60 * 1000;
  await seedStay(page, { status: "expired", responseDeadline: null, checkIn: inDays(30), checkOut: inDays(33) });
  await seedStay(page, { status: "completed", responseDeadline: null, checkIn: inDays(-10), checkOut: inDays(-7) });
  const toPay = await seedStay(page, {
    status: "accepted",
    responseDeadline: null,
    paymentDeadline: new Date(Date.now() + 90 * MINUTE_MS).toISOString(),
  });
  await page.goto("/owner/bookings");

  const cards = page.getByRole("list", { name: "Estadias" }).getByRole("listitem");
  await expect(cards).toHaveCount(3);
  await expect(cards.nth(0)).toContainText("Aceita · falta pagar");
  await expect(cards.nth(0)).toContainText(/Pague até .* pra garantir a vaga./);
  await expect(cards.nth(0).getByRole("link", { name: /^Pagar R\$\s300,00$/ })).toHaveAttribute(
    "href",
    `/owner/bookings/${toPay.id}/payment`,
  );
  await expect(cards.nth(1)).toContainText("Concluída");
  await expect(cards.nth(2)).toContainText("Expirada");
  await expect(cards.nth(2)).toContainText("Aparecida Souza não respondeu em 24 horas. Nada foi cobrado.");
  await expect(cards.nth(2).getByRole("link", { name: "Buscar outro cantinho" })).toHaveAttribute("href", "/");
});

test("REQ-STAYS-008 não aceita: o motivo do anfitrião e o caminho da busca", async ({ page }) => {
  const stay = await seedStay(page, {
    status: "declined",
    responseDeadline: null,
    declineReason: "Já estou com a casa cheia",
  });
  await page.goto(`/owner/bookings/${stay.id}`);
  await expect(page.getByText("Aparecida Souza não pôde receber dessa vez.")).toBeVisible();
  await expect(page.getByText("Motivo: Já estou com a casa cheia")).toBeVisible();
  await expect(page.getByRole("link", { name: "Procurar outro cantinho" })).toHaveAttribute("href", "/");
  await expect(page.getByRole("button", { name: "Cancelar estadia" })).toHaveCount(0);
});

test("REQ-STAYS-009 estadia de outra conta ou inexistente apresenta o 404 da casca", async ({ page }) => {
  const other = await page.request.post(`${MOCK}/__e2e/bookings`, {
    data: { hostUserId: accountFixture("both", "host").user.id, booking: CASA },
  });
  const { id } = (await other.json()) as { id: string };
  await page.goto(`/owner/bookings/${id}`);
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
  await page.goto("/owner/bookings/nao-e-um-id");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
});
