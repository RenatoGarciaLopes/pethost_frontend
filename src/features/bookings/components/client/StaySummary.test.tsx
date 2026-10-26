import { screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderWithProviders } from "@/test/render";
import { bookingDto } from "@/test/fixtures/bookings";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { StaySummary } from "./StaySummary";

it.each([undefined, { totalAmount: 300, paidAmount: 0 }])(
  "mostra a espécie sem foto nos chips do resumo, inclusive checkout %j",
  (checkout) => {
    const booking = toBooking(bookingDtoSchema.parse(bookingDto()));
    const { container, rerender } = renderWithProviders(<StaySummary booking={booking} checkout={checkout} />, {
      theme: quintalTheme,
    });
    expect(screen.getByText("Pipoca")).toBeVisible();
    const dog = container.querySelector(".MuiAvatar-root svg")!.innerHTML;
    rerender(
      <StaySummary booking={{ ...booking, pets: [{ ...booking.pets[0]!, species: "cat" }] }} checkout={checkout} />,
    );
    expect(container.querySelector(".MuiAvatar-root svg")!.innerHTML).not.toBe(dog);
    expect(screen.queryByRole("img", { name: "Pipoca" })).not.toBeInTheDocument();
    expect(screen.getByText("Pipoca")).toBeVisible();
  },
);
