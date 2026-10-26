import { describe, expect, it } from "vitest";
import { config } from "./proxy";

/** O Next lê o `matcher` como expressão regular: a mesma leitura aqui prova por onde o proxy passa. */
const runsOn = (path: string) => config.matcher.some((pattern) => new RegExp(`^${pattern}$`).test(path));

describe("REQ-SHELL-009 o proxy passa pelas páginas e pula estáticos e BFF", () => {
  it.each(["/users/profile", "/users/switch", "/host", "/owner/pets", "/admin/host-applications", "/login", "/"])(
    "roda em %s",
    (path) => {
      expect(runsOn(path)).toBe(true);
    },
  );

  it.each(["/api/auth/sessions/login", "/_next/static/chunk.js", "/_next/image", "/favicon.ico", "/brand/logo.svg"])(
    "não roda em %s",
    (path) => {
      expect(runsOn(path)).toBe(false);
    },
  );
});
