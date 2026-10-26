import { screen, waitFor } from "@testing-library/react";
import { MotionConfig } from "motion/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { Reveal } from "./Reveal";

it.each(["below", "none"] as const)("REQ-AUTH-020 conteúdo permanece acionável durante entrada %s", async (from) => {
  const click = vi.fn();
  const { user } = renderWithProviders(
    <Reveal order={7} from={from} sx={{ padding: "3px" }}>
      <button onClick={click}>Continuar</button>
    </Reveal>,
  );
  const button = screen.getByRole("button", { name: "Continuar" });
  expect(button.parentElement).toHaveStyle({ padding: "3px" });
  await user.click(button);
  expect(click).toHaveBeenCalledOnce();
});
it("REQ-AUTH-020 defaults preservam conteúdo e foco de teclado", async () => {
  const { user } = renderWithProviders(
    <Reveal>
      <button>Primeiro</button>
    </Reveal>,
  );
  await user.tab();
  expect(screen.getByRole("button", { name: "Primeiro" })).toHaveFocus();
});
it("REQ-AUTH-020 movimento reduzido anima opacidade e termina sem deslocamento", async () => {
  renderWithProviders(
    <MotionConfig reducedMotion="always">
      <Reveal>
        <button>Conteúdo</button>
      </Reveal>
    </MotionConfig>,
  );
  const block = screen.getByRole("button", { name: "Conteúdo" }).parentElement!;
  expect(block).toHaveStyle({ opacity: "0" });
  await waitFor(() => expect(block).toHaveStyle({ opacity: "1", transform: "none" }), { timeout: 3000 });
});
