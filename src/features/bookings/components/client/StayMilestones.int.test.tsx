import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { BOOKING_ID, bookingDto, ownerContactDto, THOR_ID } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { StayMilestones } from "./StayMilestones";

const copy = bookingCopy.milestones;
const ACCOUNT = "account-1";
const path = `*/api/bookings/${BOOKING_ID}`;
/** 12h do dia 21/12 em Brasília: dentro da estadia de 20 a 25. */
const DURING = new Date("2026-12-21T15:00:00Z");
const confirmed = { status: "confirmed", responseDeadline: null, contact: ownerContactDto };

function setup(overrides: Record<string, unknown>, now = DURING) {
  const queryClient = createTestQueryClient();
  const booking = toBooking(bookingDtoSchema.parse(bookingDto(overrides)));
  queryClient.setQueryData(bookingQueries.detail(ACCOUNT, BOOKING_ID).queryKey, booking);
  server.use(
    http.get("*/api/bookings/me", () => HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 }))),
  );
  return renderWithProviders(<StayMilestones accountId={ACCOUNT} booking={booking} now={now} />, {
    theme: quintalTheme,
    queryClient,
  });
}

describe("StayMilestones", { timeout: 15000 }, () => {
  it("REQ-STDAY-001 confirmada e no período: o botão grande com o nome do pet", () => {
    setup(confirmed);
    expect(screen.getByRole("button", { name: "Pipoca chegou" })).toBeInTheDocument();
  });

  it("REQ-STDAY-001 mais de um pet: 'Os pets chegaram'", () => {
    setup({
      ...confirmed,
      pets: [
        { id: "0199f0a0-0000-7000-8000-0000000000e1", name: "Pipoca", species: "dog", size: "small" },
        { id: THOR_ID, name: "Thor", species: "cat", size: null },
      ],
    });
    expect(screen.getByRole("button", { name: "Os pets chegaram" })).toBeInTheDocument();
  });

  it("REQ-STDAY-001 antes do dia: só o texto da chegada, sem botão", () => {
    setup(confirmed, new Date("2026-12-18T15:00:00Z"));
    expect(screen.getByText("A chegada é domingo, 20/12.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pipoca chegou" })).not.toBeInTheDocument();
  });

  it("REQ-STDAY-002 REQ-STDAY-005 confirma (definitivo) e comemora com anúncio", async () => {
    server.use(
      http.post(`${path}/check-in`, () =>
        HttpResponse.json(apiOk(bookingDto({ ...confirmed, status: "in_progress" }))),
      ),
    );
    const { user } = setup(confirmed);
    await user.click(screen.getByRole("button", { name: "Pipoca chegou" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar que Pipoca chegou?" });
    expect(dialog).toHaveAccessibleDescription(copy.irreversible);
    await user.click(within(dialog).getByRole("button", { name: copy.confirm }));
    expect(await screen.findByRole("status")).toHaveTextContent("Pipoca chegou! Boa estadia.");
  });

  it.each([
    ["BOOKING_CHECK_IN_TOO_EARLY", "Ainda não é o dia da chegada."],
    ["BOOKING_CHECK_IN_WINDOW_CLOSED", "O período dessa estadia já passou."],
    ["BOOKING_CONFLICT", "A estadia mudou enquanto você olhava. Confere de novo."],
  ])("REQ-STDAY-006 %s vira frase", async (code, phrase) => {
    server.use(
      http.post(`${path}/check-in`, () =>
        HttpResponse.json(apiFail(code), { status: code === "BOOKING_CONFLICT" ? 409 : 422 }),
      ),
      http.get(path, () => HttpResponse.json(apiOk(bookingDto(confirmed)))),
    );
    const { user } = setup(confirmed);
    await user.click(screen.getByRole("button", { name: "Pipoca chegou" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar que Pipoca chegou?" });
    await user.click(within(dialog).getByRole("button", { name: copy.confirm }));
    expect(await within(dialog).findByText(phrase)).toBeInTheDocument();
  });

  it("REQ-STDAY-003 em andamento: contato em destaque e 'voltou pra casa', mesmo antes do dia de saída", () => {
    setup({ ...confirmed, status: "in_progress" });
    expect(screen.getByRole("region", { name: copy.emergency })).toHaveTextContent("44999990000");
    expect(screen.getByRole("button", { name: "Pipoca voltou pra casa" })).toBeInTheDocument();
  });

  it("REQ-STDAY-004 marcar a volta confirma e agradece", async () => {
    server.use(
      http.post(`${path}/check-out`, () => HttpResponse.json(apiOk(bookingDto({ ...confirmed, status: "completed" })))),
    );
    const { user } = setup({ ...confirmed, status: "in_progress" });
    await user.click(screen.getByRole("button", { name: "Pipoca voltou pra casa" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar que Pipoca voltou pra casa?" });
    await user.click(within(dialog).getByRole("button", { name: copy.confirm }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("Pipoca voltou pra casa. Obrigado por cuidar!"),
    );
  });
});
