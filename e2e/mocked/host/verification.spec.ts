import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 15_000 };
const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const host = accountFixture("unverified", "host");

/**
 * Foto fictícia gerada no próprio navegador (canvas → PNG de verdade, que o Chromium decodifica), com uma cor por vaga:
 * nenhum documento real.
 */
async function fakePhoto(page: Page, seed: number) {
  const dataUrl = await page.evaluate((hue) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 48;
    const context = canvas.getContext("2d")!;
    context.fillStyle = `hsl(${hue}, 60%, 60%)`;
    context.fillRect(0, 0, 64, 48);
    return canvas.toDataURL("image/png");
  }, seed * 90);
  return { name: `foto-${seed}.png`, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1]!, "base64") };
}

async function choosePhoto(page: Page, label: string, seed: number) {
  await page.locator(`input[aria-label="${label}: galeria"]`).setInputFiles(await fakePhoto(page, seed));
  await expect(page.getByRole("button", { name: `${label} Tirar de novo` })).toBeVisible();
}

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "unverified", "host");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-HVER-001 a REQ-HVER-013 começa, preenche, manda as 3 fotos, envia, vê 'Em análise' e desiste", async ({
  page,
}) => {
  await page.goto("/host/application");
  await expect(page.getByRole("heading", { level: 1, name: "Minha verificação" })).toBeVisible();
  const path = page.getByRole("region", { name: "Seu caminho pra receber pets" });
  await expect(path.getByText("Abre quando sua verificação for aprovada.")).toBeVisible();

  const start = page.getByRole("link", { name: "Começar", exact: true });
  await waitForHydration(start);
  await start.click();
  await expect(page).toHaveURL("/host/application/new", NAVIGATION);

  await expect(page.getByText("As fotos servem só pra confirmar que você é você.")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Etapas da verificação" })).toBeVisible();
  await expect(page.getByText("Passo 1 de 4")).toBeVisible();
  const next = page.getByRole("button", { name: "Continuar: seus dados" });
  await waitForHydration(next);
  await next.click();
  await expect(page.getByText("Pra seguir, marca o “Li e concordo”.")).toBeVisible();
  await page.getByRole("checkbox", { name: "Li e concordo" }).check();
  await next.click();

  await expect(page.getByRole("heading", { level: 1, name: "Seus dados" })).toBeVisible();
  await page.getByRole("textbox", { name: "CPF" }).fill("52998224725");
  await page.getByRole("radio", { name: /CNH/ }).check();
  const created = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/hosts/me/application" && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Continuar: fotos" }).click();
  expect((await created).status()).toBe(201);

  await expect(page.getByRole("heading", { level: 1, name: "Fotos do documento" })).toBeVisible();
  await choosePhoto(page, "Foto da frente do documento", 1);
  await choosePhoto(page, "Foto do verso do documento", 2);
  await choosePhoto(page, "Selfie segurando o documento", 3);
  const uploaded = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/hosts/me/application/documents" &&
      response.request().method() === "PUT",
  );
  await page.getByRole("button", { name: "Continuar: confere" }).click();
  expect((await uploaded).status()).toBe(200);

  await expect(page.getByRole("heading", { level: 1, name: "Confere e envia" })).toBeVisible();
  await expect(page.getByText("***.***.247-25")).toBeVisible();
  await page.getByRole("button", { name: "Enviar pra análise" }).click();

  await expect(page).toHaveURL("/host/application", NAVIGATION);
  await expect(page.getByText("Pronto, enviada! Agora é com a gente.")).toBeVisible();
  const timeline = page.getByRole("list", { name: "Andamento da verificação" });
  await expect(timeline.locator("[aria-current='step']")).toContainText("Em análise");

  await page.getByRole("button", { name: "Desistir", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Desistir da verificação?" });
  await expect(dialog.getByRole("button", { name: "Continuar a verificação" })).toBeFocused();
  await dialog.getByRole("button", { name: "Desistir", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Você desistiu da verificação" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Começar de novo" })).toBeVisible();
});

test("REQ-HVER-014 recusa mostra o motivo, as tentativas e 'Tentar de novo', sem tom de erro", async ({ page }) => {
  const seeded = await page.request.post(`${MOCK}/__e2e/host-application`, {
    data: {
      userId: host.user.id,
      application: { status: "rejected", rejectionReason: "document_illegible" },
      remainingAttempts: 2,
    },
  });
  expect(seeded.ok()).toBe(true);

  await page.goto("/host/application");
  await expect(page.getByRole("heading", { name: "Dessa vez não deu" })).toBeVisible();
  await expect(
    page.getByText("Não deu pra ler o documento. Tira a foto de dia, perto da janela, sem reflexo."),
  ).toBeVisible();
  await expect(page.getByText("Você ainda tem 2 tentativas.")).toBeVisible();
  // O anunciador de rotas do Next também é role=alert: a regra vale para o conteúdo da página.
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);
  const retry = page.getByRole("link", { name: "Tentar de novo" });
  await waitForHydration(retry);
  await retry.click();
  await expect(page).toHaveURL("/host/application/new", NAVIGATION);
});

test("REQ-HVER-011 rascunho volta direto no passo das fotos", async ({ page }) => {
  const seeded = await page.request.post(`${MOCK}/__e2e/host-application`, {
    data: { userId: host.user.id, application: { status: "draft", missingDocuments: ["front", "back", "selfie"] } },
  });
  expect(seeded.ok()).toBe(true);

  await page.goto("/host/application/new");
  await expect(page).toHaveURL("/host/application/documents", NAVIGATION);
  await expect(page.getByRole("heading", { level: 1, name: "Fotos do documento" })).toBeVisible();
});
