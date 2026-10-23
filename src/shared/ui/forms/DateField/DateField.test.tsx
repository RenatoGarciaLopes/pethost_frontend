import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { expect, it } from "vitest";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";
import { DateField } from "./DateField";

function Controlled({ clearable = false }) {
  const [value, setValue] = useState("");
  return (
    <DateField
      label="Nascimento"
      value={value}
      onChange={setValue}
      max="2026-10-15"
      today="2026-10-15"
      clearable={clearable}
    />
  );
}

it("REQ-CAL-007 escolher um dia mostra dd/mm/aaaa no campo e respeita o máximo", async () => {
  const { user } = renderWithProviders(<Controlled />);
  const field = screen.getByLabelText("Nascimento");
  await user.click(field);
  const future = await screen.findByRole("button", { name: /, 16 de outubro de 2026/ });
  expect(future).toHaveAttribute("aria-disabled", "true");
  await user.keyboard("{Escape}");
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  await pickCalendarDays(user, field, "2026-10-10");
  expect(field).toHaveValue("10/10/2026");
});

it("REQ-CAL-007 com clearable, Limpar apaga a data e fecha", async () => {
  const { user } = renderWithProviders(<Controlled clearable />);
  const field = screen.getByLabelText("Nascimento");
  await pickCalendarDays(user, field, "2026-10-10");
  await user.click(field);
  await user.click(await screen.findByRole("button", { name: "Limpar" }));
  expect(field).toHaveValue("");
});
