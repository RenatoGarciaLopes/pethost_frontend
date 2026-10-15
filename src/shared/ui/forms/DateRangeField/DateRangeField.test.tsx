import { fireEvent, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DateRangeField } from "./DateRangeField";

it("REQ-SRCH-003 anuncia erro ao sair e respeita limites sem alterar a outra data", () => {
  const onChange = vi.fn();
  renderWithProviders(
    <DateRangeField checkIn="2026-10-14" checkOut="2026-10-17" today="2026-10-15" onChange={onChange} />,
  );
  fireEvent.blur(screen.getByLabelText("Chegada"));
  expect(screen.getByText("A chegada pode ser de hoje até 365 dias à frente.")).toBeVisible();
  expect(screen.getByLabelText("Chegada")).toHaveAttribute("aria-invalid", "true");
  fireEvent.change(screen.getByLabelText("Saída"), { target: { value: "2026-10-20" } });
  expect(onChange).toHaveBeenCalledWith({ checkIn: "2026-10-14", checkOut: "2026-10-20" });
});
