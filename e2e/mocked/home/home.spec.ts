import { expect, test, type Page } from "@playwright/test";
import { loginAccount } from "../../support/account";

async function expandSearchOnMobile(page: Page) {
  const openSearch = page.getByRole("button", { name: "Abrir busca", exact: true });
  if (await openSearch.isVisible()) await openSearch.click();
}

async function submitSearch(page: Page) {
  const desktopSearch = page.getByRole("button", { name: "Achar um cantinho", exact: true });
  const mobileSearch = page.getByRole("button", { name: "Buscar cantinhos", exact: true });
  await (await desktopSearch.isVisible() ? desktopSearch : mobileSearch).click();
}

test("REQ-HOME-001/002 visitante vê o início e volta à busca depois de entrar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle("Início · PetHost");
  await expect(
    page.getByRole("heading", { level: 1, name: "Um quintal pro seu pet enquanto você viaja." }),
  ).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("textbox", { name: "Onde" }).fill("Zona 7");
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Cão", exact: true }).click();
  await submitSearch(page);

  await expect(page).toHaveURL(/\/login\?next=/);
  const next = new URL(page.url()).searchParams.get("next");
  expect(next).toBe("/search?where=Zona+7&species=dog");
});

test("REQ-HOME-003 tutor com pet segue para busca com o id, sem dados do perfil", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Um quintal pra Luna enquanto você viaja." })).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("textbox", { name: "Onde" }).fill("Maringá");
  await submitSearch(page);
  await expect(page).toHaveURL(/\/search\?/);
  const params = new URL(page.url()).searchParams;
  expect(params.get("where")).toBe("Maringá");
  expect(params.getAll("pets")).toEqual(["0199d2a0-0000-7000-8000-0000000000e1"]);
  expect(params.has("name")).toBe(false);
});

test("REQ-HOME-002 tutor sem pet escolhe espécie sem convite para cadastro", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "single");
  await page.goto("/");
  await expect(page.getByText("Você pode buscar antes de cadastrar seu pet.")).toBeVisible();
  await expandSearchOnMobile(page);
  await page.getByRole("combobox", { name: "Pet" }).click();
  await page.getByRole("option", { name: "Gato", exact: true }).click();
  await submitSearch(page);
  await expect(page).toHaveURL(/\/search\?species=cat$/);
});

test("REQ-HOME-006 celular abre a busca pela pílula acessível", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const open = page.getByRole("button", { name: "Abrir busca" });
  await expect(open).toBeVisible();
  await expect(open).toHaveAttribute("aria-expanded", "false");
  await open.click();
  await expect(page.getByRole("button", { name: "Fechar busca" })).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("textbox", { name: "Onde" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Buscar cantinhos" })).toBeVisible();
});
