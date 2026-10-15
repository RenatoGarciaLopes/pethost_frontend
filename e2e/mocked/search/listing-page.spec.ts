import { expect, test } from "@playwright/test";
import { loginAccount } from "../../support/account";
import { LISTING_ID } from "../../support/handlers/listingPage.mjs";

test("REQ-LPAGE-001/003/004/008/009 abre o cantinho com privacidade, total e metadados", async ({ page, baseURL }) => {
  await loginAccount(page, baseURL!);
  await page.goto(`/listings/${LISTING_ID}?from=2026-10-15&to=2026-10-20&pets=0199d2a0-0000-7000-8000-0000000000e1`);
  await expect(page).toHaveTitle("Quintal da Cida · PetHost");
  await expect(page.getByRole("heading", { level: 1, name: "Quintal da Cida" })).toBeVisible();
  await expect(page.getByText("Centro, Maringá · PR")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quem mora aqui" })).toHaveCount(0);
  await expect(page.getByText("O endereço chega quando a estadia for confirmada.")).toBeVisible();
  await expect(page.getByText(/300,00/)).toBeVisible();
  // A ordem dos parâmetros não importa: confere o caminho e cada parâmetro preservado da busca.
  const request = new URL(
    (await page.getByRole("link", { name: "Pedir estadia" }).getAttribute("href")) ?? "",
    "http://localhost",
  );
  expect(request.pathname).toBe(`/listings/${LISTING_ID}/request`);
  expect(request.searchParams.get("from")).toBe("2026-10-15");
  expect(request.searchParams.get("to")).toBe("2026-10-20");
  expect(request.searchParams.getAll("pets")).not.toHaveLength(0);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);
  await page.goto("/listings/0199d2a0-0000-7000-8000-000000000099");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe" })).toBeVisible();
});
