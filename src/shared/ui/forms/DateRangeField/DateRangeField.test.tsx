import { screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { pickCalendarDays } from "@/test/calendar";
import { renderWithProviders } from "@/test/render";
import { DateRangeField } from "./DateRangeField";

function Controlled({ checkIn = "", checkOut = "" }) {
  const [range, setRange] = useState({ checkIn, checkOut });
  return <DateRangeField {...range} today="2026-10-15" onChange={setRange} />;
}

afterEach(() => vi.unstubAllGlobals());

it("REQ-SRCH-003 anuncia o erro ao fechar o calendário e devolve o foco ao campo", async () => {
  const { user } = renderWithProviders(
    <DateRangeField checkIn="2026-10-14" checkOut="2026-10-17" today="2026-10-15" onChange={vi.fn()} />,
  );
  const field = screen.getByLabelText("Chegada");
  expect(field).toHaveValue("14/10/2026");
  expect(screen.queryByText("A chegada pode ser de hoje até 365 dias à frente.")).not.toBeInTheDocument();
  await user.click(field);
  await screen.findByRole("dialog", { name: "Escolher as datas da estadia" });
  await user.keyboard("{Escape}");
  expect(await screen.findByText("A chegada pode ser de hoje até 365 dias à frente.")).toBeVisible();
  expect(field).toHaveAttribute("aria-invalid", "true");
  await waitFor(() => expect(field).toHaveFocus());
});

it("REQ-SRCH-003 escolher chegada e saída no mesmo calendário preenche os dois campos e fecha", async () => {
  const { user } = renderWithProviders(<Controlled />);
  await pickCalendarDays(user, screen.getByLabelText("Chegada"), "2026-10-20", "2026-10-25");
  expect(screen.getByLabelText("Chegada")).toHaveValue("20/10/2026");
  expect(screen.getByLabelText("Saída")).toHaveValue("25/10/2026");
});

it("REQ-SRCH-003 abrir pela saída com o período feito troca só a saída", async () => {
  const { user } = renderWithProviders(<Controlled checkIn="2026-10-20" checkOut="2026-10-25" />);
  await pickCalendarDays(user, screen.getByLabelText("Saída"), "2026-10-28");
  expect(screen.getByLabelText("Chegada")).toHaveValue("20/10/2026");
  expect(screen.getByLabelText("Saída")).toHaveValue("28/10/2026");
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
  await user.click(screen.getByLabelText("Chegada"));
  await screen.findByRole("dialog", { name: "Escolher as datas da estadia" });
  expect(screen.getAllByRole("grid")).toHaveLength(1);
  await user.click(screen.getByRole("button", { name: "Pronto" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
});
