import { describe, expect, it } from "vitest";
import { formatDateTime } from "./formatDateTime";

describe("formatDateTime", () => {
  it("REQ-AUDIT-001 exibe data e hora no fuso de Brasília", () => {
    const formatted = formatDateTime("2026-10-09T12:00:00Z");
    expect(formatted).toContain("09/10/2026");
    expect(formatted).toContain("09:00");
  });

  it("aceita Date sem alterar o fuso da máquina", () => {
    expect(formatDateTime(new Date("2026-10-09T12:00:00Z"))).toBe(formatDateTime("2026-10-09T12:00:00Z"));
  });
});
