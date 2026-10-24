import { afterEach, describe, expect, it } from "vitest";
import { bookingsHandlers, resetBookings, seedBooking } from "../../../e2e/support/handlers/bookings.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { paymentSchema, paymentSessionSchema } from "@/features/bookings";
import { server } from "./server";

const API = "http://localhost:5099";
const owner = switchAccounts.find((a) => a.scenario === "both" && a.user.role === "owner")!;
const host = switchAccounts.find((a) => a.scenario === "both" && a.user.role === "host")!;
afterEach(resetBookings);

function setup() {
  server.use(...bookingsHandlers);
  const booking = seedBooking(host.user.id, { status: "accepted" }, owner.user.id);
  const token = issueSession(owner.user).accessToken;
  const call = async (path: string, method = "GET", body?: object, accessToken = token) => {
    const response = await fetch(`${API}${path}`, {
      method,
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, body: await response.json() };
  };
  return { booking, call, path: `/api/v1/bookings/${booking.id}/payment` };
}

describe("mock de pagamento 066", () => {
  it("REQ-PAY-004/005/008 escolhe plano, abre sessão, só confirma por evento externo e relê contrato", async () => {
    const { call, path, booking } = setup();
    expect(paymentSchema.parse((await call(path)).body.data).status).toBe("not_started");
    expect((await call(path, "PUT", { installmentCount: 7 })).status).toBe(422);
    expect(paymentSchema.parse((await call(path, "PUT", { installmentCount: 3 })).body.data).installments).toHaveLength(
      3,
    );
    expect(
      paymentSessionSchema.parse((await call(`${path}/installments/1/payment-session`, "POST")).body.data).amount,
    ).toBe(100);
    expect((await call(`${path}/installments/2/payment-session`, "POST")).body.error.code).toBe(
      "PAYMENT_INSTALLMENT_OUT_OF_ORDER",
    );
    expect((await call(`${path}/synchronization`, "POST")).body.data.status).toBe("pending");
    expect((await call(`/api/v1/bookings/${booking.id}`)).body.data.status).toBe("accepted");
    await call(`/__e2e/payments/${booking.id}/paid`, "POST", { number: 1 });
    expect(paymentSchema.parse((await call(`${path}/synchronization`, "POST")).body.data).status).toBe("active");
    expect((await call(`/api/v1/bookings/${booking.id}`)).body.data).toMatchObject({
      status: "confirmed",
      contact: { phone: "44988887777" },
    });
    expect((await call(`${path}/installments/1/payment-session`, "POST")).body.error.code).toBe(
      "PAYMENT_INSTALLMENT_ALREADY_PAID",
    );
  });
  it("REQ-PAY-001/009 protege pagamento de outra conta e bloqueia prazo vencido", async () => {
    const { call, path, booking } = setup();
    const hostToken = issueSession(host.user).accessToken;
    expect((await call(path, "GET", undefined, hostToken)).status).toBe(200);
    expect((await call(path, "PUT", { installmentCount: 1 }, hostToken)).status).toBe(404);
    expect((await call(`/api/v1/bookings/0199f0a0-0000-7000-8000-000000000099/payment`)).status).toBe(404);
    const expired = seedBooking(null, { status: "accepted", paymentDeadline: "2020-01-01T12:00:00Z" }, owner.user.id);
    expect((await call(`/api/v1/bookings/${expired.id}/payment`, "PUT", { installmentCount: 1 })).body.error.code).toBe(
      "PAYMENT_WINDOW_CLOSED",
    );
    expect((await call(`/api/v1/bookings/${booking.id}`)).body.data.contact).toBeNull();
  });
});
