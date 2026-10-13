import { expect, type Locator } from "@playwright/test";

/**
 * Espera o React assumir o elemento vindo do servidor. Digitar antes disso perde o valor: na hidratação
 * o formulário volta aos valores iniciais. O React marca cada nó hidratado com uma chave `__reactFiber$…`.
 *
 * @example await waitForHydration(page.getByRole("button", { name: "Mandar o link" }))
 */
export async function waitForHydration(locator: Locator) {
  await expect
    .poll(() => locator.evaluate((element) => Object.keys(element).some((key) => key.startsWith("__reactFiber"))))
    .toBe(true);
}
