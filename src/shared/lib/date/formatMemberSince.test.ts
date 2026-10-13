import { expect, it } from "vitest";
import { formatMemberSince } from "./formatMemberSince";
it("REQ-ACC-002 escreve mês e ano em português", () => {
  expect(formatMemberSince("2026-10-13T12:00:00Z")).toBe("outubro de 2026");
});
it("REQ-ACC-002 respeita a virada do mês no fuso de São Paulo", () => {
  expect(formatMemberSince("2026-10-01T02:59:59Z")).toBe("setembro de 2026");
  expect(formatMemberSince("2026-10-01T03:00:00Z")).toBe("outubro de 2026");
});
