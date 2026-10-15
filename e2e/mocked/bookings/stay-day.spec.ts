import { expect, test } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const host = accountFixture("both", "host");
const DAY_MS = 24 * 60 * 60 * 1000;

/** Hoje em Brasília (UTC−3), o mesmo dia que o mock e a tela usam. */
const brasiliaDay = (offsetDays = 0) =>
  new Date(Date.now() - 3 * 60 * 60 * 1000 + offsetDays * DAY_MS).toISOString().slice(0, 10);

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "both", "host");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-STDAY-001 a REQ-STDAY-004 no dia: marca a chegada, vê o contato em destaque e marca a volta", async ({
  page,
}) => {
  const seeded = await page.request.post(`${MOCK}/__e2e/bookings`, {
    data: {
      hostUserId: host.user.id,
      booking: {
        status: "confirmed",
        responseDeadline: null,
        checkIn: brasiliaDay(),
        checkOut: brasiliaDay(3),
        contact: { phone: "44999990000", address: null },
      },
    },
  });
  const booking = (await seeded.json()) as { id: string };

  await page.goto(`/host/bookings/${booking.id}`);
  const arrived = page.getByRole("button", { name: "Pipoca chegou" });
  await waitForHydration(arrived);
  await arrived.click();
  const confirmArrival = page.getByRole("dialog", { name: "Confirmar que Pipoca chegou?" });
  await expect(confirmArrival).toContainText("Depois de confirmar, não dá pra desfazer.");
  await confirmArrival.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Pipoca chegou! Boa estadia.")).toBeVisible();

  await expect(page.getByRole("region", { name: "Contato do tutor para emergências" })).toContainText("44999990000");
  await page.getByRole("button", { name: "Pipoca voltou pra casa" }).click();
  await page
    .getByRole("dialog", { name: "Confirmar que Pipoca voltou pra casa?" })
    .getByRole("button", { name: "Confirmar" })
    .click();
  await expect(page.getByText("Pipoca voltou pra casa. Obrigado por cuidar!")).toBeVisible();

  await page.goto("/host/bookings?aba=anteriores");
  await expect(page.getByRole("article", { name: "Pedido de Bruno Lima" })).toBeVisible();
});

test("REQ-STDAY-001 antes do dia da chegada: só o aviso, sem botão", async ({ page }) => {
  const seeded = await page.request.post(`${MOCK}/__e2e/bookings`, {
    data: {
      hostUserId: host.user.id,
      booking: { status: "confirmed", responseDeadline: null, checkIn: brasiliaDay(2), checkOut: brasiliaDay(5) },
    },
  });
  const booking = (await seeded.json()) as { id: string };
  await page.goto(`/host/bookings/${booking.id}`);
  await expect(page.getByText(/^A chegada é /)).toBeVisible();
  await expect(page.getByRole("button", { name: "Pipoca chegou" })).toHaveCount(0);
});
