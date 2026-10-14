import { expect, test, type Page } from "@playwright/test";
import { loginAccount, mockProfileImage, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.beforeEach(async ({ page, baseURL }) => {
  await resetAccountMock(page);
  await loginAccount(page, baseURL!, "single");
});
test.afterEach(async ({ page }) => {
  await resetAccountMock(page);
});
const next = (page: Page) => page.getByRole("button", { name: "Continuar", exact: true });
async function identity(page: Page, name: string) {
  const input = page.getByLabel(/^Nome/);
  await waitForHydration(input);
  await input.fill(name);
  await page.getByRole("radio", { name: "Fêmea", exact: true }).click();
}
async function finishSteps(page: Page, dog: boolean, complete = false) {
  await next(page).click();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
    .toBe(true);
  if (dog) await page.getByRole("radio", { name: "Pequeno (P)" }).check();
  else await expect(page.getByRole("radiogroup", { name: "Porte" })).toHaveCount(0);
  if (complete) {
    await page.getByLabel("Raça").fill("Vira-lata");
    await page.getByRole("radio", { name: "Adulto", exact: true }).click();
    await page.getByLabel("Peso aproximado (kg)").fill("8.5");
  }
  await next(page).click();
  await page
    .getByRole("radiogroup", { name: "Está com as vacinas em dia?" })
    .getByRole("radio", { name: "Sim" })
    .click();
  await page.getByRole("radiogroup", { name: "É castrado?" }).getByRole("radio", { name: "Não" }).click();
  if (complete) {
    await page.getByRole("switch", { name: "Toma algum remédio?" }).check();
    await page.getByLabel("Qual remédio e como dar").fill("Uma gota depois do almoço");
    await page.getByRole("switch", { name: "Tem alguma alergia?" }).check();
    await page.getByLabel("Alergias", { exact: true }).fill("Frango");
    await page.getByLabel("Veterinário (nome e telefone)").fill("Clínica do bairro");
    await page.getByLabel("Microchip", { exact: true }).fill("123456789012345");
  }
  await next(page).click();
  if (complete) {
    await page.getByLabel("Alimentação").fill("Ração duas vezes ao dia");
    await page.getByLabel("Manias e jeito de ser").fill("Gosta de passear");
  }
  await next(page).click();
  for (const label of ["Com cachorros", "Com gatos", "Com crianças"])
    await page.getByRole("radiogroup", { name: label }).getByRole("radio", { name: "Não" }).click();
  await next(page).click();
  await expect(page.getByRole("heading", { name: "Confere a ficha" })).toBeVisible();
}
test("REQ-PNEW-016/020 cachorro completo com duas fotos aparece em Meus pets", async ({ page }) => {
  test.setTimeout(60_000);
  const image = await mockProfileImage(page);
  await page.goto("/pets/new?species=dog");
  await expect(page.getByRole("radio", { name: "Cachorro", exact: true })).toBeChecked();
  await waitForHydration(next(page));
  await next(page).click();
  await identity(page, "Pipoca");
  await page.getByLabel("Adicionar foto 1").setInputFiles({ name: "capa.png", mimeType: "image/png", buffer: image });
  await expect(page.getByAltText("Prévia da foto 1")).toBeVisible();
  await page.getByLabel("Adicionar foto 2").setInputFiles({
    name: "outra.png",
    mimeType: "image/png",
    buffer: Buffer.concat([image, Buffer.from("segunda")]),
  });
  await expect(page.getByAltText("Prévia da foto 2")).toBeVisible();
  await finishSteps(page, true, true);
  const createdResponse = page.waitForResponse(
    (response) => response.url().endsWith("/api/pets") && response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Salvar a ficha de Pipoca" }).click();
  expect((await createdResponse).status()).toBe(201);
  await expect(page.getByRole("heading", { name: "Prazer, Pipoca!" })).toBeVisible({ timeout: 15_000 });
  const created = (await (await page.request.get("/api/pets/me")).json()).data.pets.find(
    (pet: { name: string }) => pet.name === "Pipoca",
  );
  expect(created.photos).toHaveLength(2);
  expect(created.weightKg).toBe(8.5);
  expect(created.medicationNotes).toBe("Uma gota depois do almoço");
  const myPets = page.getByRole("link", { name: "Ver meus pets" });
  await waitForHydration(myPets);
  await myPets.click();
  await expect(page).toHaveURL(/\/pets$/, { timeout: 15_000 });
  await expect(page.getByRole("link", { name: "Ficha de Pipoca" })).toBeVisible();
});
test("REQ-PNEW-004/023 coelho conclui ficha mínima sem porte", async ({ page }) => {
  await page.goto("/pets/new?species=rabbit");
  await waitForHydration(next(page));
  await next(page).click();
  await identity(page, "Nuvem");
  await finishSteps(page, false);
  await page.getByRole("button", { name: "Salvar a ficha de Nuvem" }).click();
  await expect(page.getByRole("heading", { name: "Prazer, Nuvem!" })).toBeVisible();
  const pet = (await (await page.request.get("/api/pets/me")).json()).data.pets[0];
  expect(pet.species).toBe("rabbit");
  expect(pet.size).toBeNull();
});
test("REQ-PNEW-021 rascunho por conta sobrevive a recarregar e pode começar de novo", async ({ page }) => {
  await page.goto("/pets/new?species=cat");
  await waitForHydration(next(page));
  await next(page).click();
  await identity(page, "Luna");
  await next(page).click();
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.keys(sessionStorage).some((key) => {
          if (!key.startsWith("pethost:pet-draft:")) return false;
          const draft = JSON.parse(sessionStorage.getItem(key)!);
          return draft.step === 3 && draft.values.name === "Luna";
        }),
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(page.getByText("Continuando a ficha de Luna.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Sobre o corpo de Luna" })).toBeVisible();
  const restart = page.getByRole("button", { name: "Começar de novo" });
  await waitForHydration(restart);
  await restart.click();
  await expect(page.getByRole("heading", { name: "Que bicho é o seu?" })).toBeVisible();
});
test("REQ-PNEW-018 falha.jpg falha mas o pet existe e seguir sem foto conclui", async ({ page }) => {
  const image = await mockProfileImage(page);
  await page.goto("/pets/new?species=cat");
  await waitForHydration(next(page));
  await next(page).click();
  await identity(page, "Mel");
  await page.getByLabel("Adicionar foto 1").setInputFiles({ name: "falha.jpg", mimeType: "image/jpeg", buffer: image });
  await expect(page.getByAltText("Prévia da foto 1")).toBeVisible();
  await finishSteps(page, false);
  await page.getByRole("button", { name: "Salvar a ficha de Mel" }).click();
  await expect(page.getByText("A foto não subiu. Tenta de novo ou segue sem, dá pra pôr depois.")).toBeVisible();
  const pets = (await (await page.request.get("/api/pets/me")).json()).data.pets;
  expect(pets).toHaveLength(1);
  expect(pets[0].name).toBe("Mel");
  expect(pets[0].photos).toHaveLength(0);
  await page.getByRole("button", { name: "Seguir sem a foto" }).click();
  await expect(page.getByRole("heading", { name: "Prazer, Mel!" })).toBeVisible();
});
test("REQ-PNEW-002 espécie inválida é ignorada e página tem título e noindex", async ({ page }) => {
  await page.goto("/pets/new?species=dragon");
  await expect(page).toHaveTitle("Apresentar o pet · PetHost");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("radio", { name: "Cachorro", exact: true })).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Gato", exact: true })).not.toBeChecked();
});
