import { expect, test } from "@playwright/test";
import { loginAccount, resetAccountMock } from "../../support/account";
import { waitForHydration } from "../../support/hydration";

test.beforeEach(async ({ page }) => resetAccountMock(page));
test.afterEach(async ({ page }) => resetAccountMock(page));

test("REQ-HPETS-002/003 anfitrião pendente vê bloqueio na lista e antes do passo 1", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "unverified", "host");
  for (const path of ["/pets", "/pets/new"]) {
    await page.goto(path);
    await expect(page.getByText("Os pets da casa entram depois que sua verificação for aprovada.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuar" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Ver minha verificação" })).toHaveCount(0);
  }
});

test("REQ-HPETS-001/004/005/006 aprovado apresenta Bóris e a vitrine autenticada só lista ativos", async ({
  page,
  baseURL,
}) => {
  test.setTimeout(60_000);
  await loginAccount(page, baseURL!, "both", "host");
  await page.goto("/pets");
  await expect(page.getByRole("heading", { level: 1, name: "Pets da casa" })).toBeVisible();
  await expect(page.getByText("Tem bicho morando com você? Apresenta pra quem vai se hospedar aí.")).toBeVisible();
  const start = page.getByRole("link", { name: "Apresentar um pet da casa" });
  await waitForHydration(start);
  await start.click();
  await expect(page.getByRole("heading", { name: "Quem mora com você?" })).toBeVisible();
  const next = page.getByRole("button", { name: "Continuar", exact: true });
  await waitForHydration(next);
  await page.getByRole("radio", { name: "Cachorro", exact: true }).check();
  await next.click();
  await page.getByLabel(/^Nome/).fill("Bóris");
  await page.getByRole("radio", { name: "Macho", exact: true }).check();
  await next.click();
  await page.getByRole("radio", { name: "Médio (M)", exact: true }).check();
  await next.click();
  for (const label of ["Está com as vacinas em dia?", "É castrado?"])
    await page.getByRole("radiogroup", { name: label }).getByRole("radio", { name: "Sim", exact: true }).check();
  await next.click();
  await next.click();
  for (const label of ["Com cachorros", "Com gatos", "Com crianças"])
    await page.getByRole("radiogroup", { name: label }).getByRole("radio", { name: "Sim", exact: true }).check();
  await next.click();
  await page.getByRole("button", { name: "Salvar a ficha de Bóris" }).click();
  await expect(page.getByRole("heading", { name: "Prazer, Bóris!" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apresentar outro pet da casa" })).toBeVisible();
  await page.getByRole("link", { name: "Ver pets da casa" }).click();
  await expect(page.getByRole("link", { name: "Ficha de Bóris" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ficha de Luna" })).toHaveCount(0);
  const list = (await (await page.request.get("/api/pets/me")).json()).data;
  const hostId = list.keeper.id;
  const petId = list.pets[0].id;
  expect(
    (await (await page.request.get(`/api/hosts/${hostId}/pets`)).json()).data.pets.map(
      (pet: { name: string }) => pet.name,
    ),
  ).toEqual(["Bóris"]);
  const headers = { origin: baseURL!, "x-pethost-request": "1" };
  expect((await page.request.post(`/api/pets/${petId}/deactivation`, { headers })).ok()).toBe(true);
  expect((await (await page.request.get(`/api/hosts/${hostId}/pets`)).json()).data.pets).toEqual([]);
  // O consumidor visual é a futura 042; HouseResidents é coberto por componente, integração e story.
});
