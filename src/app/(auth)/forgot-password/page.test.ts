import { describe, expect, it } from "vitest";
import { metadata } from "./page";

describe("forgot-password metadata", () => {
  it("REQ-PWD-014 identifica a página no título", () => {
    expect(metadata.title).toBe("Esqueci a senha · PetHost");
  });
});
