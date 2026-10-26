import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse, delay } from "msw";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { translateError } from "@/shared/api/errors/translateError";
import { ApiError } from "@/shared/api/errors/ApiError";
import { bookingQueries } from "@/features/bookings/index.client";
import { bookingDtoSchema, toBooking } from "@/features/bookings";
import { BOOKING_ID, bookingDto } from "@/test/fixtures/bookings";
import { conversationDto, CIDA_CONVERSATION_ID } from "@/test/fixtures/conversations";
import { apiOk, apiFail } from "@/test/fixtures/session";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { server } from "@/test/msw/server";
import { BookingConversation } from "./BookingConversation";
const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
const booking = toBooking(bookingDtoSchema.parse(bookingDto()));
function setup(side: "owner" | "host") {
  const queryClient = createTestQueryClient();
  queryClient.setQueryData(bookingQueries.detail("account", BOOKING_ID).queryKey, booking);
  return renderWithProviders(<BookingConversation accountId="account" bookingId={BOOKING_ID} side={side} />, {
    queryClient,
    theme: quintalTheme,
  });
}
function list(items: unknown[]) {
  server.use(
    http.get("*/api/conversations/me", () =>
      HttpResponse.json(apiOk({ items, page: 1, pageSize: 50, totalCount: items.length, totalPages: 1 })),
    ),
  );
}
beforeEach(() => {
  push.mockClear();
  server.use(http.get("*/api/bookings/:id", () => HttpResponse.json(apiOk(bookingDto()))));
});
describe("BookingConversation", () => {
  it("tutor posts listingId once while pending and navigates to returned conversation", async () => {
    let calls = 0;
    server.use(
      http.post("*/api/conversations", async ({ request }) => {
        calls++;
        expect(await request.json()).toEqual({ listingId: booking.listingId });
        await delay(80);
        return HttpResponse.json(apiOk(conversationDto()), { status: 201 });
      }),
    );
    const { user } = setup("owner");
    const button = screen.getByRole("button", { name: /Conversar com Aparecida/ });
    await user.dblClick(button);
    await waitFor(() => expect(push).toHaveBeenCalledWith("/conversations/" + CIDA_CONVERSATION_ID));
    expect(calls).toBe(1);
  });
  it.each(["CONVERSATION_BLOCKED", "CONVERSATION_OWN_LISTING"])(
    "tutor sees translated %s and can retry",
    async (code) => {
      server.use(http.post("*/api/conversations", () => HttpResponse.json(apiFail(code), { status: 422 })));
      const { user } = setup("owner");
      await user.click(screen.getByRole("button", { name: /Conversar com/ }));
      expect(await screen.findByRole("status")).toHaveTextContent(
        translateError(new ApiError({ code, status: 422, message: code })),
      );
      expect(push).not.toHaveBeenCalled();
      expect(screen.getByRole("button", { name: /Conversar com/ })).toBeEnabled();
    },
  );
  it("tutor network failure is translated beside the action", async () => {
    server.use(http.post("*/api/conversations", () => HttpResponse.error()));
    const { user } = setup("owner");
    await user.click(screen.getByRole("button", { name: /Conversar com/ }));
    expect(await screen.findByRole("status")).toHaveTextContent(
      translateError(new ApiError({ code: "NETWORK_ERROR", status: 0, message: "network" })),
    );
    expect(push).not.toHaveBeenCalled();
  });
  it.each([1, 2])(
    "host links by ownerId with a badge and accessible unread count %i, including blocked conversations",
    async (unreadCount) => {
      list([conversationDto({ ownerId: booking.ownerId, owner: null, blocked: true, unreadCount })]);
      setup("host");
      const link = await screen.findByRole("link", {
        name:
          unreadCount === 1
            ? "Conversar com Camila Souza 1 mensagem não lida"
            : "Conversar com Camila Souza 2 mensagens não lidas",
      });
      expect(link).toHaveAttribute("href", "/conversations/" + CIDA_CONVERSATION_ID);
      expect(within(link).getByText(String(unreadCount))).toHaveAttribute("aria-hidden");
      expect(link).not.toHaveTextContent("(" + unreadCount);
    },
  );
  it("host without unread messages has no badge or unread phrase", async () => {
    list([conversationDto({ ownerId: booking.ownerId, unreadCount: 0 })]);
    setup("host");
    const link = await screen.findByRole("link", { name: "Conversar com Camila Souza" });
    expect(within(link).queryByText("0")).not.toBeInTheDocument();
    expect(link).not.toHaveTextContent("mensage");
  });
  it("host without matching conversation sees explanation and no chat action", async () => {
    list([conversationDto()]);
    setup("host");
    expect(await screen.findByText("A conversa abre quando Camila Souza mandar a primeira mensagem.")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
  it("host lookup failure shows translated error, never the empty explanation", async () => {
    server.use(http.get("*/api/conversations/me", () => HttpResponse.error()));
    setup("host");
    expect(await screen.findByRole("button", { name: "Tentar novamente" })).toBeVisible();
    expect(screen.queryByText(/A conversa abre/)).not.toBeInTheDocument();
  });
  it("host at page limit sees qualified absence and a route to conversations", async () => {
    list(Array.from({ length: 50 }, () => conversationDto()));
    setup("host");
    expect(await screen.findByText(/não aparece entre as 50 mais recentes/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver conversas" })).toHaveAttribute("href", "/conversations");
  });
});
