import { expect, type Page } from "@playwright/test";
import { waitForHydration } from "./hydration";

/**
 * Deixa o formulário da busca aberto e pronto. No celular o formulário nasce recolhido na pílula; um clique
 * antes da hidratação não faz nada, então o clique se repete até o formulário aparecer.
 */
export async function openSearch(page: Page) {
  const pill = page.getByRole("button", { name: "Onde, datas e pet" });
  const search = page.getByRole("button", { name: "Buscar", exact: true }).filter({ visible: true });
  await expect(async () => {
    if ((await pill.isVisible()) && (await pill.getAttribute("aria-expanded")) !== "true") await pill.click();
    await expect(search).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 30_000 });
  await waitForHydration(search);
}
