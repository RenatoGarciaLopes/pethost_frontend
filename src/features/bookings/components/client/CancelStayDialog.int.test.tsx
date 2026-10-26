import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { StayDetail } from "./StayDetail";

const copy = bookingCopy.cancelStay;
const path = `*/api/bookings/${BOOKING_ID}`;

function setup(overrides: Record<string, unknown>) {
  const queryClient = createTestQueryClient();
  const key = bookingQueries.detail("account-1", BOOKING_ID).queryKey;
  queryClient.setQueryDefaults(key, { staleTime: Infinity });
  queryClient.setQueryData(key, toBooking(bookingDtoSchema.parse(bookingDto(overrides))));
  server.use(
    http.get("*/api/bookings/me", () => HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 }))),
  );
  return renderWithProviders(<StayDetail accountId="account-1" bookingId={BOOKING_ID} />, {
    theme: quintalTheme,
    queryClient,
  });
}

describe("CancelStayDialog", { timeout: 15000 }, () => {
  it.each(["in_progress", "completed", "declined", "cancelled"])(
    "REQ-STAYS-006 em %s não dá pra cancelar",
    (status) => {
      setup({ status, responseDeadline: null });
      expect(screen.queryByRole("button", { name: copy.open })).not.toBeInTheDocument();
    },
  );

  it("REQ-STAYS-006 REQ-STAYS-007 cancela com motivo opcional, mostra o resultado e o reembolso", async () => {
    let body: unknown;
    server.use(
      http.post(`${path}/cancellation`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(
          apiOk(
            bookingDto({ status: "cancelled", cancelledBy: "owner", refundPercentage: 100, responseDeadline: null }),
          ),
        );
      }),
    );
    const { user } = setup({ status: "confirmed", responseDeadline: null });
    await user.click(screen.getByRole("button", { name: copy.open }));
    const dialog = await screen.findByRole("dialog", { name: copy.title });
    expect(dialog).toHaveAccessibleDescription(copy.confirmed);
    // O diálogo foca a ação segura ao terminar de abrir; só então a pessoa vai ao campo.
    await waitFor(() => expect(within(dialog).getByRole("button", { name: copy.keep })).toHaveFocus());
    await user.type(within(dialog).getByRole("textbox", { name: copy.reason }), "Mudança de planos");
    await user.click(within(dialog).getByRole("button", { name: copy.confirm }));

    expect(await screen.findByText(bookingCopy.stay.cancelled)).toBeInTheDocument();
    expect(screen.getByText("Reembolso de 100%")).toBeInTheDocument();
    expect(body).toEqual({ reason: "Mudança de planos" });
  });

  it("REQ-STAYS-009 estadia mudou ao mesmo tempo: recarrega e avisa", async () => {
    server.use(
      http.post(`${path}/cancellation`, () => HttpResponse.json(apiFail("BOOKING_CONFLICT"), { status: 409 })),
      http.get(path, () => HttpResponse.json(apiOk(bookingDto({ status: "in_progress", responseDeadline: null })))),
    );
    const { user } = setup({ status: "confirmed", responseDeadline: null });
    await user.click(screen.getByRole("button", { name: copy.open }));
    const dialog = await screen.findByRole("dialog", { name: copy.title });
    await user.click(within(dialog).getByRole("button", { name: copy.confirm }));
    expect(await screen.findByText("A estadia mudou enquanto você olhava. Confere de novo.")).toBeInTheDocument();
    expect(await screen.findByText("Em andamento")).toBeInTheDocument();
  });
});
