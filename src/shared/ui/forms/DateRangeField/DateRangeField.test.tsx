import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";
import { DateRangeField } from "./DateRangeField";

const FIELD = "Chegada e saída";

function Controlled({ checkIn = "", checkOut = "" }) {
  const [range, setRange] = useState({ checkIn, checkOut });
  return <DateRangeField {...range} today="2026-10-15" onChange={setRange} />;
}

afterEach(() => vi.unstubAllGlobals());

it("REQ-CAL-009 um campo só mostra vazio, só a chegada e o período com as noites", async () => {
  const { user } = renderWithProviders(<Controlled />);
  const field = screen.getByLabelText(FIELD);
  expect(field).toHaveValue("");
  expect(field).toHaveAttribute("placeholder", "Selecionar datas");
  await pickCalendarDays(user, field, "2026-10-20");
  expect(field).toHaveValue("20 out");
  await pickCalendarDays(user, field, "2026-10-20", "2026-10-25");
  expect(field).toHaveValue("20 a 25 out · 5 noites");
});

it("REQ-SRCH-003 anuncia o erro ao fechar o calendário e devolve o foco ao campo", async () => {
  const { user } = renderWithProviders(
    <DateRangeField checkIn="2026-10-14" checkOut="2026-10-17" today="2026-10-15" onChange={vi.fn()} />,
  );
  const field = screen.getByLabelText(FIELD);
  expect(screen.queryByText("A chegada pode ser de hoje até 365 dias à frente.")).not.toBeInTheDocument();
  await user.click(field);
  await screen.findByRole("dialog", { name: "Escolher as datas da estadia" });
  await user.keyboard("{Escape}");
  expect(await screen.findByText("A chegada pode ser de hoje até 365 dias à frente.")).toBeVisible();
  expect(field).toHaveAttribute("aria-invalid", "true");
  await waitFor(() => expect(field).toHaveFocus());
});

it("REQ-SRCH-003 no celular o calendário é folha de baixo com um mês e o botão Pronto", async () => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: true,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
  const { user } = renderWithProviders(<Controlled />);
  await user.click(screen.getByLabelText(FIELD));
  await screen.findByRole("dialog", { name: "Escolher as datas da estadia" });
  expect(screen.getAllByRole("grid")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Pronto" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
