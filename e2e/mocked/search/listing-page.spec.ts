import { expect, test } from "@playwright/test";
import { loginAccount } from "../../support/account";
import { LISTING_ID } from "../../support/handlers/listingPage.mjs";

const LUNA = "0199d2a0-0000-7000-8000-0000000000e1";

test("REQ-LPAGE-001/003/004/005/008/009/010/011 abre o cantinho como na prancha, com conta, compatibilidade e avaliações", async ({
  page,
  baseURL,
}) => {
  await loginAccount(page, baseURL!);
  await page.goto(`/listings/${LISTING_ID}?where=Zona+7&from=2026-10-15&to=2026-10-20&pets=${LUNA}`);
  await expect(page).toHaveTitle("Quintal da Cida · PetHost");
  await expect(page.getByRole("heading", { level: 1, name: "Quintal da Cida" })).toBeVisible();
  await expect(page.getByText(/^Centro, Maringá · PR · casa com quintal · tem gato$/)).toBeVisible();
  await expect(page.getByText("Casa com quintal", { exact: true })).toBeVisible();
  await expect(page.getByText("neighbor")).toHaveCount(0);
  await expect(page.getByText(/O endereço chega quando a estadia for confirmada\./)).toBeVisible();

  // Voltar leva à home com a busca de origem (a rota /search sai na 079).
  const back = new URL(
    (await page.getByRole("link", { name: "← Casas perto de Zona 7" }).getAttribute("href"))!,
    baseURL,
  );
  expect(back.pathname).toBe("/");
  expect(back.searchParams.get("where")).toBe("Zona 7");

  // Compatibilidade vem do endpoint, com quem mais a casa recebe nas datas.
  await expect(page.getByText("A Luna combina com essa casa.")).toBeVisible();
  await expect(page.getByText("Nessas datas, Casa Cida também recebe Mel (cão pequeno).")).toBeVisible();

  await expect(page.getByRole("heading", { name: "O que os tutores contam" })).toBeVisible();
  await expect(page.getByText("“Recebi foto todo dia.”")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Quem mora aqui" })).toHaveCount(0);

  await expect(page.getByText(/× 5 noites × 1 pet/)).toBeVisible();
  // A ordem dos parâmetros não importa: confere o caminho e cada parâmetro preservado da busca.
  const request = new URL(
    (await page.getByRole("link", { name: "Pedir estadia" }).getAttribute("href")) ?? "",
    baseURL,
  );
  expect(request.pathname).toBe(`/listings/${LISTING_ID}/request`);
  expect(request.searchParams.get("from")).toBe("2026-10-15");
  expect(request.searchParams.get("to")).toBe("2026-10-20");
  expect(request.searchParams.getAll("pets")).toEqual([LUNA]);
  await expect(page.locator("meta[name=robots]")).toHaveAttribute("content", /noindex/);

  // Tirar a Luna de "Quem vai" leva a escolha para a URL e some com a caixa de compatibilidade.
  await page.getByRole("button", { name: "Luna" }).click();
  await expect(page).not.toHaveURL(/pets=/);
  await expect(page.getByText("A Luna combina com essa casa.")).toHaveCount(0);

  await page.goto("/listings/0199d2a0-0000-7000-8000-000000000099");
  await expect(page.getByRole("heading", { name: "Esse cantinho não existe" })).toBeVisible();
});
