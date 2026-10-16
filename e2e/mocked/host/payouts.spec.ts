import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { hideDevIndicator } from "../../support/devIndicator";

const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const host = accountFixture("both", "host");
const CONNECT_JS_MOCK = `
(() => {
  class FakeAccountOnboarding extends HTMLElement {
    setConnector() {}
    setOnExitInternalOnly(listener) { this.onExit = listener; }
    setOnStepChangeInternalOnly() {}
    setOnLoadErrorInternalOnly() {}
    setOnLoaderStartInternalOnly() {}
    connectedCallback() {
      this.innerHTML = '<button type="button">Voltar do Stripe fake</button>';
      this.querySelector('button').addEventListener('click', () => {
        window.location.assign('/host/payments?stripe=retorno');
      });
    }
  }
  customElements.define('stripe-connect-account-onboarding', FakeAccountOnboarding);
  window.StripeConnect = {
    init: () => ({ connect: {}, update() {}, logout: () => Promise.resolve() }),
  };
})();
`;

test.beforeEach(async ({ page }) => {
  await hideDevIndicator(page);
  await resetAccountMock(page);
});
test.afterEach(async ({ page }) => resetAccountMock(page));

async function seedStripe(page: Page, status: "restricted" | "enabled") {
  const response = await page.request.post(`${MOCK}/__e2e/stripe-account`, {
    data: { userId: host.user.id, status },
  });
  expect(response.ok()).toBe(true);
}

test("REQ-PAYOUT-002 sem verificação orienta a concluir a etapa anterior", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "unverified", "host");
  await page.goto("/host/payments");

  await expect(
    page.getByText("Primeiro a gente confere quem você é. Depois é aqui que você diz como quer receber."),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver minha verificação" })).toHaveAttribute("href", "/host/application");
});

test("REQ-PAYOUT-003/004/007/009/011 abre o Connect fake e volta com a conta sincronizada", async ({
  page,
  baseURL,
}) => {
  await loginAccount(page, baseURL!, "both", "host");
  await page.route("https://connect-js.stripe.com/v1.0/connect.js", (route) =>
    route.fulfill({ status: 200, contentType: "application/javascript", body: CONNECT_JS_MOCK }),
  );
  await page.goto("/host/payments");

  await expect(
    page.getByText("O tutor paga antes. A PetHost guarda o dinheiro e te passa 90% quando o pet volta pra casa."),
  ).toBeVisible();
  const session = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/hosts/me/stripe-account/onboarding-session" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Cadastrar como eu recebo" }).click();
  expect((await session).ok()).toBe(true);
  const onboarding = page.getByRole("region", { name: "Cadastro de recebimento" });
  await expect(onboarding.getByRole("button", { name: "Voltar do Stripe fake" })).toBeVisible();

  const synchronization = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/hosts/me/stripe-account/synchronization" &&
      response.request().method() === "POST",
  );
  await onboarding.getByRole("button", { name: "Voltar do Stripe fake" }).click();
  expect((await synchronization).ok()).toBe(true);
  await expect(page).toHaveURL(/\/host\/payments$/);
  await expect(page.getByText("Recebimento conectado ✓")).toBeVisible();
  await expect(page.getByRole("link", { name: "Montar meu cantinho" })).toHaveAttribute("href", "/host/listings");
});

test("REQ-PAYOUT-008 restricted explica o dado pendente e permite resolver", async ({ page, baseURL }) => {
  await seedStripe(page, "restricted");
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/host/payments");

  await expect(page.getByText("O Stripe precisa de mais uma coisa: confirmar alguns dados.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Resolver agora" })).toBeVisible();
  await expect(page.getByText("requirements.pending_verification")).toHaveCount(0);
});

test("REQ-PAYOUT-009 enabled confirma o recebimento e abre o próximo passo", async ({ page, baseURL }) => {
  await seedStripe(page, "enabled");
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/host/payments");

  await expect(page.getByText("Recebimento conectado ✓")).toBeVisible();
  await expect(page.getByRole("link", { name: "Montar meu cantinho" })).toHaveAttribute("href", "/host/listings");
});
