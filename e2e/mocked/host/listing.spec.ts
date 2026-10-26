import { expect, test, type Page } from "@playwright/test";
import { accountFixture, loginAccount, resetAccountMock } from "../../support/account";
import { hideDevIndicator } from "../../support/devIndicator";
import { waitForHydration } from "../../support/hydration";
import { mockViaCep } from "../../support/registration";

// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 15_000 };
const MOCK = process.env.E2E_ACCOUNT_MOCK_URL ?? "http://localhost:5099";
const host = accountFixture("both", "host");

async function enablePayouts(page: Page) {
  const response = await page.request.post(`${MOCK}/__e2e/host-payouts`, {
    data: { userId: host.user.id, enabled: true },
  });
  expect(response.ok()).toBe(true);
}

/** "Continuar" do passo (ou "Voltar pra revisão") e espera o título do próximo passo. */
async function continueTo(page: Page, title: string) {
  await page.getByRole("button", { name: /^Continuar: / }).click();
  await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
}

/** Foto fictícia gerada no próprio navegador (canvas → PNG de verdade): nada de foto real. */
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
  return { name: `casa-${seed}.png`, mimeType: "image/png", buffer: Buffer.from(dataUrl.split(",")[1]!, "base64") };
}

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  // No celular, a barra fixa de "Continuar" fica embaixo, sob o selo do `next dev`.
  await hideDevIndicator(page);
  await resetAccountMock(page);
  await mockViaCep(page);
  await loginAccount(page, baseURL!, "both", "host");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-LIST-002 sem recebimento conectado, o cadastro do cantinho não abre", async ({ page }) => {
  await page.goto("/host/listings/new");
  await expect(page.getByText("Seu cantinho abre depois que o recebimento estiver conectado.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver como eu recebo" })).toHaveAttribute("href", "/host/payments");
});

test("REQ-LIST-001 a REQ-LIST-015 monta o cantinho em passos, abre, põe foto, pausa e reabre", async ({ page }) => {
  await enablePayouts(page);
  await page.goto("/host");
  const path = page.getByRole("region", { name: "Seu caminho pra receber pets" });
  const build = path.getByRole("link", { name: "Montar meu cantinho" });
  await waitForHydration(build);
  await build.click();
  await expect(page).toHaveURL("/host/listings/new", NAVIGATION);
  await expect(page.getByText("Passo 1 de 9")).toBeVisible();

  const yard = page.getByRole("radiogroup", { name: "Tem quintal?" });
  await waitForHydration(yard.getByRole("radio", { name: "Sim" }));
  await page.getByRole("radio", { name: /^Casa/ }).click();
  await yard.getByRole("radio", { name: "Sim" }).click();
  await continueTo(page, "Como o seu cantinho se chama?");

  await page.getByRole("button", { name: /Casa da/ }).click();
  await page.getByRole("textbox", { name: "Conta como é a sua casa" }).fill("Casa térrea com quintal gramado.");
  await continueTo(page, "Quem mora com você?");

  for (const question of ["Mora cachorro aí?", "Mora gato aí?", "Mora criança aí?"])
    await page.getByRole("radiogroup", { name: question }).getByRole("radio", { name: "Não" }).click();
  await continueTo(page, "Quem você recebe?");

  await page.getByRole("checkbox", { name: "Cachorro", exact: true }).check();
  await page.getByRole("checkbox", { name: /^Pequeno/ }).check();
  await page.getByRole("button", { name: "Aumentar Quantos pets ao mesmo tempo?" }).click();
  await continueTo(page, "Onde fica o cantinho?");
  await continueTo(page, "Tem alguma regra da casa?");
  await continueTo(page, "Em que dias você recebe?");

  await page.getByRole("checkbox", { name: "Todos os dias" }).check();
  await continueTo(page, "Quanto é a diária?");

  await page.getByRole("textbox", { name: "Diária por pet" }).fill("60,00");
  await expect(page.getByText(/Com 2 pets por 10 noites no mês, você recebe R\$\s1\.080,00/)).toBeVisible();
  await continueTo(page, "Confere e abre");

  await expect(page.getByRole("region", { name: "Quem você recebe" })).toContainText(
    "Cachorro · porte P · até 2 pets por vez",
  );
  const created = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/api/listings" && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Abrir meu cantinho" }).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "Seu cantinho está aberto!" })).toBeVisible();

  await page.getByRole("link", { name: "Pôr as fotos da casa" }).click();
  await expect(page).toHaveURL(/\/host\/listings\/[0-9a-f-]+#secao-photos$/, NAVIGATION);
  await expect(page.getByRole("heading", { level: 1, name: /^Casa da/ })).toBeVisible();
  const photos = page.getByRole("group", { name: "Fotos da casa" });
  await waitForHydration(page.getByLabel("Adicionar foto 1"));
  await page.getByLabel("Adicionar foto 1").setInputFiles(await fakePhoto(page, 1));
  await expect(photos.getByRole("img", { name: "Foto 1" })).toBeVisible();

  await page.getByRole("button", { name: "Pausar meu cantinho" }).click();
  const dialog = page.getByRole("dialog", { name: "Pausar o cantinho?" });
  await expect(dialog).toContainText("O cantinho sai da busca até você reabrir. Pedidos já aceitos continuam.");
  await dialog.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(page.getByText("Seu cantinho está pausado: não aparece na busca. Dá pra editar tudo.")).toBeVisible();
  await page.getByRole("button", { name: "Reabrir" }).click();
  await expect(page.getByText("Aberto", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Meu painel" }).click();
  await expect(page).toHaveURL("/host", NAVIGATION);
  await expect(page.getByRole("article", { name: /^Casa da/ })).toContainText("Aberto");
});
