import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 30_000 };
// A ficha do pet vem do BFF no cliente; no `next dev` a primeira chamada ainda compila a rota dele.
const FIRST_BFF_CALL = { timeout: 30_000 };
const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const host = accountFixture("both", "host");

/** Semeia um pedido para o anfitrião (a 050, que cria pedidos pelo tutor, ainda não existe). */
async function seedRequest(page: Page, booking: Record<string, unknown> = {}) {
  const response = await page.request.post(`${MOCK}/__e2e/bookings`, { data: { hostUserId: host.user.id, booking } });
  expect(response.ok()).toBe(true);
  return (await response.json()) as { id: string };
}

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "both", "host");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-HREQ-001 a REQ-HREQ-004 do painel ao pedido: lê a ficha do pet, aceita e vê o telefone do tutor", async ({
  page,
}) => {
  // Primeira jornada do arquivo: no `next dev` compila painel, lista, detalhe e as rotas do BFF a frio.
  test.setTimeout(60_000);
  await seedRequest(page);
  await page.goto("/host");
  await expect(page.getByText("1 pedido esperando resposta")).toBeVisible();
  const see = page.getByRole("link", { name: "Ver pedidos" });
  await waitForHydration(see);
  await see.click();
  await expect(page).toHaveURL("/host/bookings?aba=pedidos", NAVIGATION);

  const card = page.getByRole("article", { name: "Pedido de Bruno Lima" });
  await expect(card).toContainText("Pipoca (cachorro, porte pequeno)");
  await expect(card).toContainText(/Responda até/);
  const open = card.getByRole("link", { name: "Ver pedido de Bruno Lima" });
  await waitForHydration(open);
  await open.click();
  await expect(page).toHaveURL(/\/host\/bookings\/[0-9a-f-]+$/, NAVIGATION);

  await expect(page.getByRole("article", { name: "Carteirinha de Pipoca" })).toBeVisible(FIRST_BFF_CALL);
  await page.getByRole("button", { name: "Aceitar" }).click();
  const dialog = page.getByRole("dialog", { name: "Aceitar o pedido?" });
  await expect(dialog).toContainText("O tutor recebe seu endereço e seu telefone.");
  await dialog.getByRole("button", { name: "Aceitar" }).click();
  await expect(page.getByText("Estadia confirmada!")).toBeVisible();
  await expect(page.getByText("Telefone: 44999990000")).toBeVisible();

  await page.goto("/host/bookings?aba=proximas");
  await expect(page.getByRole("article", { name: "Pedido de Bruno Lima" })).toBeVisible();
});

test("REQ-HREQ-005 'Não posso receber' com motivo de atalho, sem tom de erro", async ({ page }) => {
  const booking = await seedRequest(page);
  await page.goto(`/host/bookings/${booking.id}`);
  const decline = page.getByRole("button", { name: "Não posso receber" });
  await waitForHydration(decline);
  await decline.click();
  const dialog = page.getByRole("dialog", { name: "Não vai dar dessa vez?" });
  await dialog.getByRole("button", { name: /Não estarei em casa/ }).click();
  await expect(dialog.getByRole("textbox", { name: "Motivo (opcional)" })).toHaveValue("Não estarei em casa");
  await expect(dialog.getByRole("alert")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Não posso receber" }).click();
  await expect(page.getByText("Você não pôde receber esse pedido.")).toBeVisible();
});

test("REQ-HREQ-007 estadia confirmada: contato do tutor e cancelamento com devolução inteira", async ({ page }) => {
  const booking = await seedRequest(page, {
    status: "confirmed",
    responseDeadline: null,
    contact: { phone: "44999990000", address: null },
  });
  await page.goto(`/host/bookings/${booking.id}`);
  await expect(page.getByRole("region", { name: "Contato do tutor" })).toContainText("Telefone: 44999990000");
  const cancel = page.getByRole("button", { name: "Cancelar estadia" });
  await waitForHydration(cancel);
  await cancel.click();
  const dialog = page.getByRole("dialog", { name: "Cancelar a estadia?" });
  await expect(dialog).toContainText("O tutor recebe o valor de volta, inteiro.");
  await dialog.getByRole("button", { name: "Cancelar estadia" }).click();
  await expect(page.getByText("Essa estadia foi cancelada.")).toBeVisible();
});
