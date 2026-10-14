import { expect, test } from "@playwright/test";
import { loginAccount } from "../../support/account";

test("REQ-PETS-001/002/005/006 tutora vê as carteirinhas prontas, o tile e 'Fora da lista'", async ({
  page,
  baseURL,
}) => {
  await loginAccount(page, baseURL!);
  await page.goto("/pets");
  await expect(page).toHaveTitle("Meus pets · PetHost");
  await expect(page.getByRole("heading", { level: 1, name: "Meus pets" })).toBeVisible();
  const luna = page.getByRole("link", { name: "Ficha de Luna" });
  await expect(luna).toBeVisible();
  await expect(luna).toHaveAttribute("href", "/pets/0199d2a0-0000-7000-8000-0000000000e1");
  await expect(page.getByRole("link", { name: "Ficha de Thor" })).toContainText("Gato");
  await expect(page.getByRole("link", { name: "Apresentar outro pet" })).toHaveAttribute("href", "/pets/new");
  const inactive = page.getByRole("button", { name: "Fora da lista (1)" });
  await expect(inactive).toHaveAttribute("aria-expanded", "false");
  await inactive.click();
  await expect(page.getByRole("link", { name: "Ficha de Mel" })).toBeVisible();
});

test("REQ-SHELL-002/008 'Meus pets' no cabeçalho marca a página atual", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto("/pets");
  const shortcut = page
    .getByRole("navigation", { name: "Navegação principal" })
    .getByRole("link", { name: "Meus pets" })
    .first();
  if (await shortcut.isVisible()) {
    await expect(shortcut).toHaveAttribute("aria-current", "page");
  } else {
    // Celular: o atalho mora na gaveta.
    await page.getByRole("button", { name: "Abrir a navegação" }).click();
    await expect(page.getByRole("link", { name: "Meus pets" }).last()).toHaveAttribute("aria-current", "page");
  }
});

test("REQ-PETS-004 conta sem pet vê o convite para apresentar o primeiro", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!, "single");
  await page.goto("/pets");
  await expect(page.getByText("Apresenta seu pet pra gente? Leva uns 3 minutos.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Apresentar meu pet" })).toHaveAttribute("href", "/pets/new");
});

test("REQ-PETS-010 visitante vai para o login com o caminho de volta", async ({ page }) => {
  await page.goto("/pets");
  await expect(page).toHaveURL(/\/login\?next=%2Fpets$/);
});
