import { expect, type Locator, type Page } from "@playwright/test";

const dayFormat = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Nome do dia como o calendário diz. @example calendarDayName("2026-11-08") // "domingo, 8 de novembro de 2026" */
export const calendarDayName = (iso: string) => dayFormat.format(new Date(`${iso}T00:00:00Z`));

/**
 * Abre o calendário pelo campo, toca nos dias ISO dados (avançando de mês em mês até achar cada um) e fecha:
 * no celular pelo "Pronto", no desktop o intervalo completo já fecha sozinho e um dia solto fecha com Esc.
 *
 * @example await pickDates(page, page.getByLabel("Chegada e saída", { exact: true }).filter({ visible: true }), from, to)
 */
export async function pickDates(page: Page, field: Locator, ...days: string[]) {
  await field.click();
  const dialog = page.getByRole("dialog", { name: /^Escolher/ });
  await expect(dialog).toBeVisible();
  for (const iso of days) {
    const day = dialog.getByRole("button", {
      name: new RegExp(`^${calendarDayName(iso)}(,|$)`),
    });
    for (let guard = 0; guard < 14 && !(await day.isVisible()); guard += 1) {
      await dialog.getByRole("button", { name: "Próximo mês" }).click();
    }
    await day.click();
  }
  const done = dialog.getByRole("button", { name: "Pronto" });
  if (await done.isVisible()) await done.click();
  else if (await dialog.isVisible()) await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
}
