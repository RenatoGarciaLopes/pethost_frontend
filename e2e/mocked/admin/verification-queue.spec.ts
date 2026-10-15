import { expect, test } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "admin", "admin");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-AQUEUE-001/002/003 fila pagina 27 solicitações e mantém filtros na URL", async ({ page }) => {
  await page.goto("/admin/host-applications?status=unknown&page=1");
  await expect(page.getByRole("heading", { name: "Fila de verificação" })).toBeVisible();
  await expect(page.getByLabel("Status", { exact: true })).toHaveValue("submitted");
  await expect(page.getByRole("link", { name: "Pessoa 01", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pessoa 26", exact: true })).toHaveCount(0);
  const second = page.getByRole("button", { name: "Ir para a página 2" });
  await waitForHydration(second);
  await second.click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByRole("link", { name: "Pessoa 26", exact: true })).toBeVisible();
  await page.getByLabel("Status", { exact: true }).selectOption("approved");
  await expect(page).toHaveURL(/status=approved.*page=1/);
  await expect(page.getByText("Ninguém esperando agora")).toBeVisible();
});

test("REQ-AQUEUE-005/006/007/009/012/016 abre foto sob ação e decide com checklist", async ({ page, isMobile }) => {
  const photoRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/host-applications\/[^/]+\/documents\//.test(new URL(request.url()).pathname))
      photoRequests.push(request.url());
  });
  await page.goto("/admin/host-applications");
  await page.getByRole("link", { name: "Pessoa 01", exact: true }).click();
  // Sem prefetch (página privada), a rota do detalhe compila no clique na primeira visita do `next dev`.
  await expect(page.getByRole("heading", { name: "Conferir verificação: Pessoa 01" })).toBeVisible({ timeout: 15_000 });
  expect(photoRequests).toEqual([]);
  const open = page.getByRole("button", { name: "Abrir foto: Frente do documento", exact: true });
  await waitForHydration(open);
  await open.click();
  const dialog = page.getByRole("dialog", { name: "Frente do documento", exact: true });
  await expect(dialog.getByRole("img")).toBeVisible();
  await expect(dialog.getByRole("status")).toContainText("Esse link vence em");
  expect(photoRequests).toHaveLength(1);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  if (isMobile) {
    await expect(page.getByText("Pra decidir, abre num computador")).toBeVisible();
    await expect(page.getByRole("button", { name: "Aprovar", exact: true })).toHaveCount(0);
    return;
  }
  const approve = page.getByRole("button", { name: "Aprovar", exact: true });
  await expect(approve).toBeDisabled();
  await page
    .getByRole("textbox", { name: "Nota interna (motivo da decisão)" })
    .fill("Dados e fotos conferidos no teste.");
  await expect(approve).toBeDisabled();
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await approve.click();
  await expect(page.getByText("Decisão registrada.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Próxima da fila" })).toBeVisible();
  await expect(approve).toHaveCount(0);
  await page.getByRole("link", { name: "Próxima da fila" }).click();
  await expect(page.getByRole("heading", { name: "Conferir verificação: Pessoa 02" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Consultar CNPJ na Receita" })).toBeVisible();
});

test("REQ-AQUEUE-010/011 suspeita de fraude exige confirmação explícita", async ({ page, isMobile }) => {
  test.skip(isMobile, "Decisão disponível somente a partir de 900px.");
  await page.goto("/admin/host-applications/0199d2a0-0000-7000-8000-000000003100");
  const reason = page.getByRole("textbox", { name: "Nota interna (motivo da decisão)" });
  await waitForHydration(reason);
  await reason.fill("Suspeita registrada no cenário sintético.");
  await page.getByRole("button", { name: "Documento ilegível", exact: true }).click();
  await expect(page.getByText("Não conseguimos ler o documento nas fotos.")).toBeVisible();
  await page.getByRole("button", { name: "Suspeita de fraude", exact: true }).click();
  const confirm = page.getByRole("button", { name: "Confirmar recusa final", exact: true });
  await expect(confirm).toBeDisabled();
  await page.getByRole("checkbox", { name: "Confirmo que a pessoa não poderá tentar de novo" }).check();
  const rejected = page.waitForResponse(
    (response) => response.url().endsWith("/rejection") && response.request().method() === "POST",
  );
  await confirm.click();
  const response = await rejected;
  expect(response.request().postDataJSON().rejectionReason).toBe("suspected_fraud");
  await expect(page.getByText("Decisão registrada.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Aprovar", exact: true })).toHaveCount(0);
});

test("REQ-AQUEUE-005 rota inválida usa o 404 sem exibir dados", async ({ page }) => {
  await page.goto("/admin/host-applications/invalid-id");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
});
