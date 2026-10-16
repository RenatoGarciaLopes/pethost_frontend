import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import { bookingErrorDetail } from "./bookingErrorDetail";

const error = (code: string, message: string) => new ApiError({ status: 422, code, message });

describe("bookingErrorDetail", () => {
  it("REQ-HREQ-006 lê a data citada no erro (a API manda só na mensagem) e devolve em formato brasileiro", () => {
    expect(
      bookingErrorDetail(
        error("BOOKING_CAPACITY_EXCEEDED", "The listing has no room for these pets on the night of 2026-12-21."),
      ),
    ).toEqual({ date: "2026-12-21", dateLabel: "21/12" });
    expect(
      bookingErrorDetail(
        error("BOOKING_WEEKDAY_NOT_AVAILABLE", "The host does not receive pets on Sundays (2026-12-27)."),
      ),
    ).toEqual({ date: "2026-12-27", dateLabel: "27/12" });
  });

  it("REQ-HREQ-006 sem data ou sem ApiError, nada", () => {
    expect(bookingErrorDetail(error("BOOKING_CAPACITY_EXCEEDED", "No room."))).toBeNull();
    expect(bookingErrorDetail(new Error("x"))).toBeNull();
  });
});
