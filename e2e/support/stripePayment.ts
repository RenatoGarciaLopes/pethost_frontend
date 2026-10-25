import { expect, type Page } from "@playwright/test";
import { createStripeSdkFixture } from "../../src/test/stripeSdk";

/** Instala Stripe sintético só no navegador do teste. Nunca altera a aplicação ou a configuração de produção. */
export async function mockStripePayment(
  page: Page,
  options: { pending?: boolean; failLoad?: boolean; failConfirm?: boolean; holdConfirm?: boolean } = {},
) {
  let release = () => {};
  const confirmationGate = options.holdConfirm
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();
  await page.addInitScript({
    content: `window.Stripe = () => (${createStripeSdkFixture.toString()})(${JSON.stringify({ autoReady: true, failLoad: options.failLoad })});`,
  });
  await page.route("https://stripe.pethost.test/confirm", async (route) => {
    const { bookingId, installmentNumber } = route.request().postDataJSON() as {
      bookingId: string;
      method: string;
      installmentNumber: number;
    };
    await confirmationGate;
    if (options.failConfirm) {
      await route.fulfill({
        headers: { "access-control-allow-origin": "*" },
        json: { error: { message: "synthetic raw decline" } },
      });
      return;
    }
    if (!options.pending) {
      const result = await page.request.post(`http://localhost:5099/__e2e/payments/${bookingId}/paid`, {
        data: { number: installmentNumber },
      });
      expect(result.ok()).toBe(true);
    }
    await route.fulfill({
      headers: { "access-control-allow-origin": "*" },
      json: { paymentIntent: { status: options.pending ? "processing" : "succeeded" } },
    });
  });
  return { release };
}
