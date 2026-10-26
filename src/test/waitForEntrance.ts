import { expect, waitFor } from "storybook/test";

/** Stories com `Reveal`/animação de passo: o axe e as asserções esperam o fim do fade de entrada (opacity 1). */
export async function waitForEntrance({ canvasElement }: { canvasElement: HTMLElement }) {
  await waitFor(() => {
    for (const element of canvasElement.querySelectorAll<HTMLElement>('[style*="opacity"]')) {
      expect(getComputedStyle(element).opacity).toBe("1");
    }
  });
}
