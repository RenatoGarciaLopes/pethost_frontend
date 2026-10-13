import { describe, expect, it } from "vitest";
import { IMAGE_RULES, validateImageFile } from "./validateImageFile";

const image = (type: string, name: string, size = 1) => new File([new Uint8Array(size)], name, { type });
describe("conferência de foto", () => {
  it.each([
    ["image/jpeg", "foto.JPG"],
    ["image/png", "foto.png"],
    ["image/webp", "foto.webp"],
  ])("REQ-ACC-014 aceita %s com extensão %s", (type, name) =>
    expect(validateImageFile(image(type!, name!))).toEqual({ ok: true }),
  );
  it("REQ-ACC-014 aceita o limite de 5 MB e recusa um byte a mais", () => {
    expect(IMAGE_RULES.maxBytes).toBe(5 * 1024 * 1024);
    expect(validateImageFile(image("image/png", "foto.png", IMAGE_RULES.maxBytes))).toEqual({ ok: true });
    expect(validateImageFile(image("image/png", "foto.png", IMAGE_RULES.maxBytes + 1))).toEqual({
      ok: false,
      reason: "size",
    });
  });
  it("REQ-ACC-014 recusa vazio, MIME incompatível e extensão incompatível", () => {
    expect(validateImageFile(image("image/png", "foto.png", 0))).toEqual({ ok: false, reason: "empty" });
    expect(validateImageFile(image("text/plain", "foto.png"))).toEqual({ ok: false, reason: "type" });
    expect(validateImageFile(image("image/png", "foto.exe"))).toEqual({ ok: false, reason: "type" });
    expect(validateImageFile(image("image/png", "foto.jpg"))).toEqual({ ok: false, reason: "type" });
  });
  it("REQ-ACC-014 usa extensão quando o navegador não informa MIME e aceita regras próprias", () => {
    expect(validateImageFile(image("", "foto.jpeg"))).toEqual({ ok: true });
    expect(validateImageFile(image("image/png", "foto.png", 2), { types: ["image/jpeg"], maxBytes: 10 })).toEqual({
      ok: false,
      reason: "type",
    });
    expect(validateImageFile(image("image/jpeg", "foto.jpg", 2), { types: ["image/jpeg"], maxBytes: 1 })).toEqual({
      ok: false,
      reason: "size",
    });
  });
});
