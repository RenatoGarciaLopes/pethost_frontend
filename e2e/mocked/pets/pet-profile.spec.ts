import { expect, test } from "@playwright/test";
import { loginAccount, mockProfileImage, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

const lunaId = "0199d2a0-0000-7000-8000-0000000000e1";
const profilePath = `/pets/${lunaId}`;
const apiPath = `/api/pets/${lunaId}`;
// Navegação no cliente: no `next dev` a primeira visita compila a rota (como em `new-pet.spec.ts`).
const NAVIGATION = { timeout: 30_000 };

// Os projetos mocked-desktop e mocked-mobile executam a mesma jornada, com estado isolado.
test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!);
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});

test("REQ-PEDIT-001 abre a ficha pela carteirinha e apresenta os blocos completos", async ({ page }) => {
  await page.goto("/pets");
  const card = page.getByRole("link", { name: /^Ficha de Luna/ });
  await waitForHydration(card);
  await card.click();
  await expect(page).toHaveURL(profilePath, NAVIGATION);
  await expect(page.getByRole("heading", { level: 1, name: "Ficha de Luna", exact: true })).toBeAttached();
  const profile = page.getByRole("article", { name: "Carteirinha de Luna", exact: true });
  await expect(profile).toBeVisible();
  for (const name of ["Saúde", "Rotina e manias", "Convivência"])
    await expect(profile.getByText(name, { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar ficha", exact: true })).toHaveAttribute(
    "href",
    `${profilePath}/edit`,
  );
});

test("REQ-PEDIT-004/005 edita Saúde com PATCH mínimo e vê a alteração na ficha", async ({ page }) => {
  await page.goto(`${profilePath}/edit`);
  await expect(page.getByRole("heading", { level: 1, name: "Editar a ficha de Luna" })).toBeVisible();
  const health = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { level: 2, name: "Saúde", exact: true }) });
  const vet = health.getByLabel("Veterinário (nome e telefone)", { exact: true });
  await waitForHydration(vet);
  await vet.fill("Clínica do bairro, atendimento de manhã");
  const saved = page.waitForResponse(
    (response) => new URL(response.url()).pathname === apiPath && response.request().method() === "PATCH",
  );
  await health.getByRole("button", { name: "Salvar Saúde", exact: true }).click();
  const response = await saved;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON()).toEqual({ vetContact: "Clínica do bairro, atendimento de manhã" });
  await expect(health.getByRole("status")).toHaveText("Salvo.");
  await page.getByRole("link", { name: "Ficha de Luna", exact: true }).click();
  await expect(page).toHaveURL(profilePath, NAVIGATION);
  await expect(page.getByRole("article", { name: "Carteirinha de Luna" })).toContainText(
    "Clínica do bairro, atendimento de manhã",
  );
});

test("REQ-PEDIT-005 salvar sem alterações informa que nada mudou e não envia PATCH", async ({ page }) => {
  await page.goto(`${profilePath}/edit`);
  const health = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { level: 2, name: "Saúde", exact: true }) });
  const save = health.getByRole("button", { name: "Salvar Saúde", exact: true });
  await waitForHydration(save);
  const patches: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === apiPath && request.method() === "PATCH") patches.push(request.url());
  });
  await save.click();
  await expect(health.getByRole("status")).toHaveText("Nada mudou por aqui.");
  expect(patches).toEqual([]);
});

test("REQ-PEDIT-008 adiciona, troca e tira uma foto mantendo a identidade na troca", async ({ page }) => {
  const image = await mockProfileImage(page);
  await page.goto(`${profilePath}/edit`);
  const photos = page.getByRole("group", { name: "Fotos de Luna", exact: true });
  const add = photos.getByLabel("Adicionar foto 1", { exact: true });
  await waitForHydration(add);
  const uploaded = page.waitForResponse(
    (response) => new URL(response.url()).pathname === `${apiPath}/photos` && response.request().method() === "POST",
  );
  await add.setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: image });
  const uploadResponse = await uploaded;
  expect(uploadResponse.ok()).toBe(true);
  const original = (await uploadResponse.json()).data.photos[0] as { id: string; url: string };
  await expect(photos.getByLabel("Trocar foto 1", { exact: true })).toBeAttached();
  const replaced = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `${apiPath}/photos/${original.id}` &&
      response.request().method() === "PATCH",
  );
  await photos.getByLabel("Trocar foto 1", { exact: true }).setInputFiles({
    name: "nova-capa.png",
    mimeType: "image/png",
    buffer: Buffer.concat([image, Buffer.from("nova-capa")]),
  });
  const replacement = await replaced;
  expect(replacement.ok()).toBe(true);
  const updated = (await replacement.json()).data.photos as { id: string; url: string }[];
  expect(updated).toHaveLength(1);
  expect(updated[0].id).toBe(original.id);
  expect(updated[0].url).not.toBe(original.url);
  await expect(photos.getByRole("img", { name: "Foto 1", exact: true })).toHaveAttribute("src", updated[0].url);
  const removed = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === `${apiPath}/photos/${original.id}` &&
      response.request().method() === "DELETE",
  );
  await photos.getByRole("button", { name: "Tirar foto 1", exact: true }).click();
  const removal = await removed;
  expect(removal.ok()).toBe(true);
  expect((await removal.json()).data.photos).toEqual([]);
  await expect(photos.getByLabel("Adicionar foto 1", { exact: true })).toBeAttached();
  await expect(photos.getByRole("button", { name: "Tirar foto 1", exact: true })).toHaveCount(0);
});

test("REQ-PEDIT-003/011/012 tira da lista com confirmação e reativa pela ficha", async ({ page }) => {
  await page.goto(profilePath);
  const deactivate = page.getByRole("button", { name: "Tirar da lista", exact: true });
  await waitForHydration(deactivate);
  await deactivate.click();
  const dialog = page.getByRole("dialog", { name: "Tirar Luna da lista?", exact: true });
  await expect(dialog).toContainText("A ficha de Luna sai da sua lista. As estadias antigas continuam no histórico.");
  await expect(dialog.getByRole("button", { name: "Deixar como está", exact: true })).toBeFocused();
  await dialog.getByRole("button", { name: "Tirar da lista", exact: true }).click();
  await expect(page).toHaveURL(/\/pets$/, NAVIGATION);
  await expect(page.getByRole("status").filter({ hasText: "A ficha de Luna saiu da lista." })).toBeVisible();
  const inactive = page.getByRole("button", { name: "Fora da lista (2)", exact: true });
  await waitForHydration(inactive);
  await inactive.click();
  await page.getByRole("link", { name: /^Ficha de Luna/ }).click();
  await expect(page).toHaveURL(profilePath, NAVIGATION);
  await expect(page.getByText("Fora da lista", { exact: true })).toBeVisible();
  const reactivate = page.getByRole("button", { name: "Voltar pra lista", exact: true });
  await waitForHydration(reactivate);
  await reactivate.click();
  await expect(page.getByText("Fora da lista", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Tirar da lista", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Tirar da lista", exact: true })).toBeVisible();
});

test("REQ-PEDIT-002 UUID inexistente apresenta o estado 404 da casca", async ({ page }) => {
  await page.goto("/pets/0199d2a0-0000-7000-8000-0000000000ff");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Editar ficha", exact: true })).toHaveCount(0);
});

test("REQ-PEDIT-002/016 pet de outra conta apresenta o mesmo estado 404", async ({ page, baseURL }) => {
  // Inicializa Luna na conta dona antes de entrar na conta single, que não tem pets.
  expect((await page.request.get(apiPath)).ok()).toBe(true);
  await loginAccount(page, baseURL!, "single");
  await page.goto(profilePath);
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe", exact: true })).toBeVisible();
  await expect(page.getByRole("article", { name: "Carteirinha de Luna", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Editar ficha", exact: true })).toHaveCount(0);
});

test("REQ-PEDIT-017 continuar editando preserva alteração ao tentar voltar à ficha", async ({ page }) => {
  await page.goto(`${profilePath}/edit`);
  const vet = page.getByLabel("Veterinário (nome e telefone)", { exact: true });
  await waitForHydration(vet);
  await vet.fill("Clínica ainda não salva");
  await page.getByRole("link", { name: "Ficha de Luna", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Sair sem salvar?", exact: true });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Continuar editando", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(`${profilePath}/edit`, NAVIGATION);
  await expect(vet).toHaveValue("Clínica ainda não salva");
});
