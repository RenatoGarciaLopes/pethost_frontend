import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { bookingErrorDetail } from "./bookingErrorDetail";

const error = (code: string, params: Record<string, string> = {}) =>
  new ApiError({ status: 422, code, message: "english from the API 2026-01-01", params });

describe("bookingErrorDetail", () => {
  it("REQ-HREQ-006 lê a data de params.date e devolve em formato brasileiro, sem olhar a mensagem", () => {
    expect(bookingErrorDetail(error("BOOKING_CAPACITY_EXCEEDED", { date: "2026-12-21" }))).toEqual({
      date: "2026-12-21",
      dateLabel: "21/12",
    });
    expect(bookingErrorDetail(error("BOOKING_WEEKDAY_NOT_AVAILABLE", { date: "2026-12-27" }))).toEqual({
      date: "2026-12-27",
      dateLabel: "27/12",
    });
  });

  it("REQ-HREQ-006 sem params.date válido ou sem ApiError, nada", () => {
    expect(bookingErrorDetail(error("BOOKING_CAPACITY_EXCEEDED"))).toBeNull();
    expect(bookingErrorDetail(error("BOOKING_CAPACITY_EXCEEDED", { date: "amanhã" }))).toBeNull();
    expect(bookingErrorDetail(new Error("x"))).toBeNull();
  });
});
