import { expect, it } from "vitest";
import { searchOriginHref } from "./searchOrigin";

it("REQ-LPAGE-011 volta para a home com os parâmetros da busca de origem, nunca para /search", () => {
  expect(searchOriginHref("where=Zona+7&from=2026-12-20&to=2026-12-25&pets=pet-1")).toBe(
    "/?where=Zona+7&from=2026-12-20&to=2026-12-25&pets=pet-1",
  );
  expect(searchOriginHref("")).toBe("/");
});
