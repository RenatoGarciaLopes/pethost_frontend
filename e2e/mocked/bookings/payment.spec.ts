import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";
import { mockStripePayment } from "../../support/stripePayment";

const MOCK = "http://localhost:5099";
const owner = accountFixture("both", "owner");
test.setTimeout(90000);

async function seed(page: Page, overrides: Record<string, unknown> = {}) {
  const result = await page.request.post(`${MOCK}/__e2e/bookings`, {
    data: {
      ownerUserId: owner.user.id,
      booking: {
        status: "accepted",
        responseDeadline: null,
        listingId: "0199d2a0-0000-7000-8000-000000000042",
        listing: {
          id: "0199d2a0-0000-7000-8000-000000000042",
          title: "Quintal da Cida",
          neighborhood: "Centro",
          city: "Maringá",
          state: "PR",
        },
        host: { id: "0199d2a0-0000-7000-8000-0000000000b1", name: "Casa Cida", avatarUrl: null },
        ...overrides,
      },
    },
  });
  expect(result.ok()).toBe(true);
  return (await result.json()) as { id: string };
}

/** Prints de todos os estados nos dois projetos, sem declarar Stripe/API real validados. */
async function capture(page: Page, state: string, mobile: boolean) {
  await page.setViewportSize({ width: mobile ? 390 : 1440, height: mobile ? 844 : 960 });
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/066/${state}-${mobile ? 390 : 1440}.png`,
    fullPage: true,
    animations: "disabled",
  });
}

test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "both", "owner");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-PAY-001/002/004/005/006/008 cartão: da estadia aceita à confirmada pela API", async ({ page, isMobile }) => {
  const stripe = await mockStripePayment(page, { holdConfirm: true });
  const booking = await seed(page);
  await page.goto(`/owner/bookings/${booking.id}`);
  const action = page.getByRole("link", { name: "Pagar estadia" });
  await waitForHydration(action);
  await action.click();
  await expect(page.getByRole("heading", { name: "Confirme e pague" })).toBeVisible({ timeout: 60000 });
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByRole("complementary", { name: "Resumo da estadia" })).toContainText("Quintal da Cida");
  await capture(page, "ready", isMobile);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  const pay = page.getByRole("button", { name: /Pagar R\$/ });
  await expect(pay).toBeEnabled();
  await capture(page, "card", isMobile);
  await pay.click();
  await expect(page.getByRole("button", { name: "Esperando o banco confirmar" })).toBeDisabled();
  await capture(page, "sending", isMobile);
  stripe.release();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toBeFocused();
  await capture(page, "success", isMobile);
  await page.getByRole("link", { name: "Ver a estadia" }).click();
  await expect(page.getByRole("region", { name: "Contato do anfitrião" })).toContainText("Avenida Brasil");
});

test("REQ-PAY-007/008 Pix fica pendente, reabre e só confirma depois do banco simulado", async ({ page, isMobile }) => {
  await mockStripePayment(page, { pending: true });
  const booking = await seed(page);
  await page.goto(`/owner/bookings/${booking.id}/payment`);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await page.getByRole("radio", { name: "Pix", exact: true }).check();
  await capture(page, "pix", isMobile);
  await page.getByRole("button", { name: /Pagar R\$/ }).click();
  await expect(page.getByRole("heading", { name: "Esperando o banco confirmar" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toHaveCount(0);
  await capture(page, "waiting", isMobile);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Confirme e pague" })).toBeVisible();
  const paid = await page.request.post(`${MOCK}/__e2e/payments/${booking.id}/paid`, { data: { number: 1 } });
  expect(paid.ok()).toBe(true);
  await page.goto(
    `/owner/bookings/${booking.id}/payment?payment_return=1&installment=1&payment_intent_client_secret=synthetic`,
  );
  await expect(page.getByRole("heading", { name: "Fechado!" })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/owner/bookings/${booking.id}/payment$`));
});

test("REQ-PAY-003/009/010 prazo vencido e erro de sessão não permitem falsa confirmação", async ({
  page,
  isMobile,
}) => {
  await mockStripePayment(page);
  const expired = await seed(page, { paymentDeadline: "2020-01-01T12:00:00Z" });
  await page.goto(`/owner/bookings/${expired.id}/payment`);
  await expect(page.getByText("O prazo deste pagamento acabou.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Continuar para o pagamento" })).toHaveCount(0);
  await capture(page, "expired", isMobile);
  const booking = await seed(page);
  await page.route(`**/api/bookings/${booking.id}/payment/installments/1/payment-session`, (route) =>
    route.fulfill({
      status: 503,
      json: {
        success: false,
        error: { code: "PAYMENT_STRIPE_UNAVAILABLE", message: "raw failure" },
        timestamp: new Date().toISOString(),
      },
    }),
  );
  await page.goto(`/owner/bookings/${booking.id}/payment`);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page.getByRole("button", { name: "Continuar para o pagamento" })).toBeEnabled();
  await expect(page.getByText("raw failure")).toHaveCount(0);
  await capture(page, "error", isMobile);
});

test("REQ-PAY-010 SDK indisponível e loading têm retorno acessível", async ({ page, isMobile }) => {
  await mockStripePayment(page, { failLoad: true });
  const booking = await seed(page, { listing: null });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(`**/api/bookings/${booking.id}/payment`, async (route) => {
    if (route.request().method() === "GET") await gate;
    await route.continue();
  });
  await page.goto(`/owner/bookings/${booking.id}/payment`);
  await expect(page.getByText("Preparando o pagamento").first()).toBeVisible();
  await capture(page, "loading", isMobile);
  release();
  await expect(page.getByText("Um cantinho esperando por seus pets")).toBeVisible();
  await capture(page, "no-photo", isMobile);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await expect(page.getByRole("alert")).toContainText("O pagamento ainda não está disponível");
  await capture(page, "sdk-error", isMobile);
});

test("REQ-PAY-009 recusa do SDK permite tentar novamente sem expor mensagem técnica", async ({ page, isMobile }) => {
  await mockStripePayment(page, { failConfirm: true });
  const booking = await seed(page);
  await page.goto(`/owner/bookings/${booking.id}/payment`);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  const pay = page.getByRole("button", { name: /Pagar R\$/ });
  await pay.click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByText("synthetic raw decline")).toHaveCount(0);
  await expect(pay).toBeEnabled();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toHaveCount(0);
  await capture(page, "sdk-decline", isMobile);
});

test("REQ-PAY-011 parcela seguinte preserva plano e não repete celebração", async ({ page, isMobile }) => {
  await mockStripePayment(page);
  const booking = await seed(page);
  await page.goto(`/owner/bookings/${booking.id}/payment`);
  await page.getByRole("radio", { name: /^3 parcelas/ }).check();
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await page.getByRole("button", { name: /Pagar R\$\s*100,00/ }).click();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toBeVisible();
  await page.getByRole("link", { name: "Ver a estadia" }).click();
  await page.getByRole("link", { name: "Ver pagamento e parcelas" }).click();
  await expect(page.getByRole("heading", { name: "Confirme e pague" })).toBeVisible();
  await expect(page.getByRole("radio", { name: /^3 parcelas/ })).toHaveCount(0);
  await capture(page, "next-installment", isMobile);
  await page.getByRole("button", { name: "Continuar para o pagamento" }).click();
  await page.getByRole("button", { name: /Pagar R\$\s*100,00/ }).click();
  await expect(page.getByText(/Já pago:.*200,00/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Fechado!" })).toHaveCount(0);
});
