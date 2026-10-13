import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("reset-password metadata", () => {
  it("REQ-PWD-013 e REQ-PWD-014 identifica a página sem enviar referrer", () => {
    expect(metadata.title).toBe("Senha nova · PetHost");
    expect(metadata.referrer).toBe("no-referrer");
  });
});
