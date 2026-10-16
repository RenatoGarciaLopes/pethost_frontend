import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { BOOKING_ID, bookingDto, ownerContactDto } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { bookingDtoSchema } from "../../api/contracts";
import { toBooking } from "../../api/mappers";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { HostBookingDetail } from "./HostBookingDetail";

const ACCOUNT = "account-1";
const path = `*/api/bookings/${BOOKING_ID}`;
const NOW = new Date("2026-12-10T15:00:00Z");

function setup(overrides: Record<string, unknown> = {}) {
  const queryClient = createTestQueryClient();
  const key = bookingQueries.detail(ACCOUNT, BOOKING_ID).queryKey;
  queryClient.setQueryDefaults(key, { staleTime: Infinity });
  queryClient.setQueryData(key, toBooking(bookingDtoSchema.parse(bookingDto(overrides))));
  server.use(
    http.get("*/api/bookings/me", () => HttpResponse.json(apiOk({ items: [], page: 1, pageSize: 20, totalCount: 0 }))),
  );
  return renderWithProviders(
    <HostBookingDetail
      accountId={ACCOUNT}
      bookingId={BOOKING_ID}
      now={NOW}
      petProfiles={<p>fichas dos pets aqui</p>}
    />,
    { theme: quintalTheme, queryClient },
  );
}

describe("HostBookingDetail", { timeout: 15000 }, () => {
  it("REQ-HREQ-002 REQ-HREQ-003 o pedido com tutor, período, total, prazo, trilha e as fichas dos pets", () => {
    setup();
    expect(screen.getByRole("heading", { level: 1, name: "Pedido de Camila Souza" })).toBeInTheDocument();
    expect(screen.getByText("Esperando resposta")).toBeInTheDocument();
    expect(screen.getByText("20 a 25 de dez. · 5 noites")).toBeInTheDocument();
    expect(screen.getByText("Responda até amanhã às 9h")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: bookingCopy.detail.trail })).toBeInTheDocument();
    expect(screen.getByText("fichas dos pets aqui")).toBeInTheDocument();
  });

  it("REQ-HREQ-004 REQ-HREQ-008 aceitar confirma com o que acontece e mostra o telefone do tutor", async () => {
    server.use(
      http.post(`${path}/acceptance`, () =>
        HttpResponse.json(apiOk(bookingDto({ status: "confirmed", responseDeadline: null, contact: ownerContactDto }))),
      ),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: bookingCopy.accept.open }));
    const dialog = await screen.findByRole("dialog", { name: bookingCopy.accept.title });
    expect(dialog).toHaveAccessibleDescription(
      "Você recebe Pipoca de 20 a 25 de dez. O tutor recebe seu endereço e seu telefone.",
    );
    await user.click(within(dialog).getByRole("button", { name: bookingCopy.accept.confirm }));

    expect(await screen.findByText(bookingCopy.accept.done)).toBeInTheDocument();
    expect(screen.getByText("Telefone: 44999990000")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("REQ-HREQ-005 'Não posso receber' pede confirmação neutra com motivo opcional e chips", async () => {
    let body: unknown;
    server.use(
      http.post(`${path}/refusal`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(apiOk(bookingDto({ status: "declined", responseDeadline: null })));
      }),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: bookingCopy.decline.open }));
    const dialog = await screen.findByRole("dialog", { name: bookingCopy.decline.title });
    await user.click(within(dialog).getByRole("button", { name: /Já estou com a casa cheia/ }));
    expect(within(dialog).getByRole("textbox", { name: bookingCopy.decline.reason })).toHaveValue(
      "Já estou com a casa cheia",
    );
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: bookingCopy.decline.confirm }));

    expect(await screen.findByText(bookingCopy.detail.closed.declined!)).toBeInTheDocument();
    expect(body).toEqual({ reason: "Já estou com a casa cheia" });
  });

  it.each([
    ["BOOKING_RESPONSE_EXPIRED", "O prazo de 24 horas passou e o pedido expirou."],
    ["BOOKING_CAPACITY_EXCEEDED", "Não cabe mais ninguém nessas noites."],
    ["BOOKING_OWNER_INACTIVE", "Esse tutor não está mais ativo. Dá pra recusar ou deixar expirar."],
  ])("REQ-HREQ-006 %s vira frase dentro do diálogo", async (code, phrase) => {
    server.use(
      http.post(`${path}/acceptance`, () => HttpResponse.json(apiFail(code), { status: 422 })),
      http.get(path, () => HttpResponse.json(apiOk(bookingDto()))),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: bookingCopy.accept.open }));
    const dialog = await screen.findByRole("dialog", { name: bookingCopy.accept.title });
    await user.click(within(dialog).getByRole("button", { name: bookingCopy.accept.confirm }));
    expect(await within(dialog).findByText(phrase)).toBeInTheDocument();
  });

  it("REQ-HREQ-006 pedido já respondido recarrega e mostra o status atual", async () => {
    server.use(
      http.post(`${path}/acceptance`, () =>
        HttpResponse.json(apiFail("BOOKING_NOT_AWAITING_RESPONSE"), { status: 422 }),
      ),
      http.get(path, () => HttpResponse.json(apiOk(bookingDto({ status: "cancelled", responseDeadline: null })))),
    );
    const { user } = setup();
    await user.click(screen.getByRole("button", { name: bookingCopy.accept.open }));
    const dialog = await screen.findByRole("dialog", { name: bookingCopy.accept.title });
    await user.click(within(dialog).getByRole("button", { name: bookingCopy.accept.confirm }));
    expect(await screen.findByText(bookingCopy.detail.closed.cancelled!)).toBeInTheDocument();
  });

  it("REQ-HREQ-007 confirmada: contato do tutor e cancelar com a devolução inteira", async () => {
    let cancelled = false;
    server.use(
      http.post(`${path}/cancellation`, () => {
        cancelled = true;
        return HttpResponse.json(apiOk(bookingDto({ status: "cancelled", responseDeadline: null })));
      }),
    );
    const { user } = setup({ status: "confirmed", responseDeadline: null, contact: ownerContactDto });
    const contact = screen.getByRole("region", { name: bookingCopy.detail.contact });
    expect(contact).toHaveTextContent("Telefone: 44999990000");
    expect(screen.queryByRole("button", { name: bookingCopy.accept.open })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: bookingCopy.cancel.open }));
    const dialog = await screen.findByRole("dialog", { name: bookingCopy.cancel.title });
    expect(dialog).toHaveAccessibleDescription(bookingCopy.cancel.message);
    await user.click(within(dialog).getByRole("button", { name: bookingCopy.cancel.confirm }));
    expect(await screen.findByText(bookingCopy.detail.closed.cancelled!)).toBeInTheDocument();
    expect(cancelled).toBe(true);
  });

  it("REQ-STDAY-004 marcar a volta mostra o agradecimento mesmo com a estadia já concluída", async () => {
    server.use(
      http.post(`${path}/check-out`, () =>
        HttpResponse.json(apiOk(bookingDto({ status: "completed", responseDeadline: null, contact: ownerContactDto }))),
      ),
    );
    const { user } = setup({ status: "in_progress", responseDeadline: null, contact: ownerContactDto });
    await user.click(screen.getByRole("button", { name: "Pipoca voltou pra casa" }));
    const dialog = await screen.findByRole("dialog", { name: "Confirmar que Pipoca voltou pra casa?" });
    await user.click(within(dialog).getByRole("button", { name: "Confirmar" }));
    expect(await screen.findByText("Pipoca voltou pra casa. Obrigado por cuidar!")).toBeInTheDocument();
    expect(screen.getByText("Concluída")).toBeInTheDocument();
  });
});
