import { expect, test, type Page } from "@playwright/test";

/**
 * Jornada real da verificação (spec 030) contra a API .NET de teste, com uma conta de anfitrião de demonstração
 * ainda não verificada e documentos FICTÍCIOS gerados aqui. Desiste no fim para limpar. As credenciais vêm do
 * ambiente (`E2E_HOST_EMAIL`, `E2E_HOST_PASSWORD`); sem elas, a jornada é pulada.
 */
const email = process.env.E2E_HOST_EMAIL;
const password = process.env.E2E_HOST_PASSWORD;
const NAVIGATION = { timeout: 30_000 };

/** PNG fictício de 64×64 com cor diferente por vaga (a API recusa a mesma imagem em duas vagas). */
async function fakePhoto(page: Page, color: string) {
  const dataUrl = await page.evaluate((fill) => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;
    context.fillStyle = fill;
    context.fillRect(0, 0, 64, 64);
    return canvas.toDataURL("image/png");
  }, color);
  return {
    name: `ficticia-${color.slice(1)}.png`,
    mimeType: "image/png",
    buffer: Buffer.from(dataUrl.split(",")[1]!, "base64"),
  };
}

test.skip(!email || !password, "Defina E2E_HOST_EMAIL e E2E_HOST_PASSWORD de uma conta de anfitrião de demonstração.");

test("REQ-HVER-002 a REQ-HVER-012 até 'Em análise' com documentos fictícios, e desiste no fim", async ({
  page,
  baseURL,
}) => {
  const login = await page.request.post("/api/auth/sessions/login", {
    headers: { origin: baseURL!, "x-pethost-request": "1" },
    data: { email, password, role: "host" },
  });
  expect(login.status()).toBe(200);

  await page.goto("/host/application/new");
  await page.getByRole("checkbox", { name: "Li e concordo" }).check();
  await page.getByRole("button", { name: "Continuar: seus dados" }).click();
  await page.getByRole("textbox", { name: "CPF" }).fill(process.env.E2E_HOST_CPF ?? "52998224725");
  await page.getByRole("radio", { name: /CNH/ }).check();
  await page.getByRole("button", { name: "Continuar: fotos" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Fotos do documento" })).toBeVisible(NAVIGATION);
  const slots = [
    ["Foto da frente do documento", "#F2C14E"],
    ["Foto do verso do documento", "#7FB77E"],
    ["Selfie segurando o documento", "#8EC5E8"],
  ] as const;
  for (const [label, color] of slots)
    await page.locator(`input[aria-label="${label}: galeria"]`).setInputFiles(await fakePhoto(page, color));
  await page.getByRole("button", { name: "Continuar: confere" }).click();
  await page.getByRole("button", { name: "Enviar pra análise" }).click();

  await expect(page).toHaveURL("/host/application", NAVIGATION);
  await expect(page.getByRole("list", { name: "Andamento da verificação" })).toBeVisible();

  await page.getByRole("button", { name: "Desistir", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Desistir", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Você desistiu da verificação" })).toBeVisible();
});
