import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { bookingDto, bookingPageDto } from "@/test/fixtures/bookings";
import { apiFail, apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { countWaitingRequests, getBookingDetail } from "./bookings.server";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
vi.mock("next/navigation", () => ({ notFound }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (name === "pethost_at" ? { value: "access-sintetico" } : undefined) }),
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.10" }),
}));

const API = "http://api.test/api/v1";

describe("bookings.server", () => {
  it("REQ-HREQ-001 conta os pedidos esperando resposta pela API, com o access da sessão", async () => {
    let query = "";
    server.use(
      http.get(`${API}/bookings/me`, ({ request }) => {
        expect(request.headers.get("authorization")).toBe("Bearer access-sintetico");
        query = new URL(request.url).search;
        return HttpResponse.json(apiOk({ ...bookingPageDto([bookingDto()]), totalCount: 3 }));
      }),
    );
    expect(await countWaitingRequests("account-1")).toBe(3);
    expect(query).toContain("status=requested");
  });

  it("REQ-HREQ-001 falha na contagem não derruba o painel", async () => {
    server.use(
      http.get(`${API}/bookings/me`, () => HttpResponse.json(apiFail("BOOKING_HOST_NOT_FOUND"), { status: 404 })),
    );
    expect(await countWaitingRequests("account-2")).toBe(0);
  });

  it("REQ-HREQ-003 reserva de outra conta ou inexistente vira o 404 da casca", async () => {
    server.use(http.get(`${API}/bookings/:id`, () => HttpResponse.json(apiFail("BOOKING_NOT_FOUND"), { status: 404 })));
    await expect(getBookingDetail("account-1", bookingDto().id)).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
