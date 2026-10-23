import { expect } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

const DIALOG = { name: /^Escolher/ };

/**
 * Abre o calendário pelo campo e toca nos dias ISO dados, navegando de mês em mês até achar cada um (os dias
 * trazem `data-iso`). Se o calendário ficar aberto (só a chegada, ou um dia só), fecha com Esc, como o usuário.
 *
 * @example await pickCalendarDays(user, screen.getByLabelText("Chegada e saída"), "2026-12-20", "2026-12-25")
 */
export async function pickCalendarDays(user: UserEvent, field: HTMLElement, ...days: string[]) {
  await user.click(field);
  const dialog = await screen.findByRole("dialog", DIALOG);
  for (const iso of days) {
    for (let guard = 0; guard < 400 && !dialog.querySelector(`[data-iso="${iso}"]`); guard += 1) {
      const first = dialog.querySelector<HTMLElement>("[data-iso]")!.dataset.iso!;
      await user.click(within(dialog).getByRole("button", { name: iso < first ? "Mês anterior" : "Próximo mês" }));
    }
    await user.click(dialog.querySelector<HTMLElement>(`[data-iso="${iso}"]`)!);
  }
  if (screen.queryByRole("dialog", DIALOG)) await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog", DIALOG)).not.toBeInTheDocument());
}
