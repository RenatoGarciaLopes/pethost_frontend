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

const section = (page: Page, name: string) => page.getByRole("region", { name, exact: true });

async function saveSection(page: Page, name: string) {
  const region = section(page, name);
  await region.getByRole("button", { name: `Salvar ${name}` }).click();
  // Na seção "Quem você recebe" o contador também é um status (output): o aviso é o que diz "Pronto.".
  await expect(region.getByRole("status").filter({ hasText: "Pronto." })).toBeVisible();
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
  // No celular, "Abrir meu cantinho" fica no fim da página, sob o selo do `next dev`.
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

test("REQ-LIST-001 a REQ-LIST-015 monta o cantinho por seções, abre, põe foto, pausa e reabre", async ({ page }) => {
  await enablePayouts(page);
  await page.goto("/host");
  const path = page.getByRole("region", { name: "Seu caminho pra receber pets" });
  const build = path.getByRole("link", { name: "Montar meu cantinho" });
  await waitForHydration(build);
  await build.click();
  await expect(page).toHaveURL("/host/listings/new", NAVIGATION);
  await expect(page.getByText("Faltam 7 coisas pro seu cantinho abrir")).toBeVisible();

  const home = section(page, "Sua casa");
  await waitForHydration(home.getByRole("button", { name: "Salvar Sua casa" }));
  await home.getByRole("radio", { name: "Casa", exact: true }).click();
  await home.getByRole("radiogroup", { name: "Tem quintal?" }).getByRole("radio", { name: "Sim" }).click();
  await home.getByRole("button", { name: /^Usar “Casa da/ }).click();
  await home.getByRole("textbox", { name: "Conta como é a sua casa" }).fill("Casa térrea com quintal gramado.");
  await saveSection(page, "Sua casa");

  const household = section(page, "Quem mora com você");
  for (const question of ["Mora cachorro aí?", "Mora gato aí?", "Mora criança aí?"])
    await household.getByRole("radiogroup", { name: question }).getByRole("radio", { name: "Não" }).click();
  await saveSection(page, "Quem mora com você");

  const guests = section(page, "Quem você recebe");
  await guests.getByRole("checkbox", { name: "Cachorro" }).check();
  await guests.getByRole("checkbox", { name: "Pequeno" }).check();
  await guests.getByRole("button", { name: "Aumentar Quantos pets ao mesmo tempo?" }).click();
  await saveSection(page, "Quem você recebe");

  await saveSection(page, "Endereço");
  await saveSection(page, "Regras da casa");

  const weekdays = section(page, "Dias que recebe");
  await weekdays.getByRole("button", { name: "Todos os dias" }).click();
  await saveSection(page, "Dias que recebe");

  const rate = section(page, "Diária por pet");
  await rate.getByRole("textbox", { name: "Diária por pet" }).fill("60,00");
  await expect(rate.getByText(/Com 2 pets por 10 noites no mês, você recebe R\$\s1\.080,00/)).toBeVisible();
  await saveSection(page, "Diária por pet");

  await expect(page.getByText("Tudo pronto!")).toBeVisible();
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
