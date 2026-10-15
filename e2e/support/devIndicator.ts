import type { Page } from "@playwright/test";

/**
 * Esconde o indicador do `next dev` (o selo fixo no canto de baixo, em `nextjs-portal`). O E2E roda em modo dev, e no
 * celular o selo cobre o botão que fica no fim da página: o clique espera até estourar o tempo. Quem usa o app não vê
 * esse selo; erros continuam aparecendo pelas asserções. Vale para todo documento aberto depois da chamada.
 *
 * @example test.beforeEach(async ({ page }) => { await hideDevIndicator(page); });
 */
export async function hideDevIndicator(page: Page) {
  await page.addInitScript(() => {
    // O script roda antes de existir o documento: o estilo entra quando o HTML estiver lido.
    document.addEventListener("DOMContentLoaded", () => {
      const style = document.createElement("style");
      style.textContent = "nextjs-portal { display: none !important; }";
      document.head.appendChild(style);
    });
  });
}
