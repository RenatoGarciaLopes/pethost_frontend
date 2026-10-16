import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { waitForHydration } from "../../support/hydration";

test("REQ-AACC-005/006 admin suspende e reativa tutor descartável criado nesta jornada", async ({ page, baseURL }) => {
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;
  const cpf = process.env.E2E_ADMIN_SYNTHETIC_CPF;
  test.skip(
    !adminEmail || !adminPassword || !cpf,
    "Configure admin de teste e CPF sintético exclusivo para a jornada real.",
  );

  const headers = { origin: baseURL!, "x-pethost-request": "1" };
  const email = `e2e-admin-account-${randomUUID()}@example.test`;
  const registered = await page.request.post("/api/owners/register", {
    headers,
    data: {
      fullName: "Tutor descartável E2E",
      email,
      password: "E2e#PetHost2026!",
      phone: "11999999999",
      birthDate: "1990-01-01",
      cpf,
      address: {
        zipCode: "87010000",
        street: "Rua de Teste",
        number: "10",
        neighborhood: "Centro",
        city: "Maringá",
        state: "PR",
      },
    },
  });
  expect(registered.status()).toBe(201);
  const ownerId = (await registered.json()).data.owner.id as string;
  const loginAdmin = () =>
    page.request.post("/api/auth/sessions/login", {
      headers,
      data: { email: adminEmail, password: adminPassword, role: "admin" },
    });

  try {
    expect((await loginAdmin()).ok()).toBe(true);
    await page.goto(`/admin/users/owners/${ownerId}`);
    await expect(page.getByRole("heading", { name: "Tutor descartável E2E" })).toBeVisible();
    const suspend = page.getByRole("button", { name: "Suspender conta" });
    await waitForHydration(suspend);
    await suspend.click();
    const suspension = page.getByRole("dialog", { name: "Suspender conta" });
    await suspension.getByRole("textbox", { name: "Motivo" }).fill("Verificação do fluxo admin automatizado.");
    await suspension.getByRole("button", { name: "Suspender conta" }).click();
    await expect(page.getByText("Conta suspensa.")).toBeVisible();
    await page.getByRole("button", { name: "Tirar suspensão" }).click();
    const lift = page.getByRole("dialog", { name: "Tirar suspensão" });
    await expect(lift).toContainText("A pessoa recebe um e-mail e volta ao status que tinha antes");
    await lift.getByRole("button", { name: "Tirar suspensão" }).click();
    await expect(page.getByText("Suspensão retirada.")).toBeVisible();
    await expect(page.getByText("Ativa", { exact: true })).toBeVisible();
  } finally {
    expect((await loginAdmin()).ok()).toBe(true);
    const detail = await page.request.get(`/api/owners/${ownerId}`, { headers });
    if (detail.ok() && (await detail.json()).data.suspendedAt) {
      expect((await page.request.delete(`/api/owners/${ownerId}/suspension`, { headers })).ok()).toBe(true);
    }
  }
});
