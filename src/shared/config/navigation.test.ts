import { describe, expect, it } from "vitest";
import { NAV_ITEMS, navItemsFor } from "./navigation";

describe("REQ-SHELL-002 tabela única de atalhos", () => {
  it("cada papel vê só os seus atalhos", () => {
    expect(navItemsFor("owner").map((item) => item.href)).toEqual(["/pets"]);
    expect(navItemsFor("host")).toEqual([]);
    expect(navItemsFor("admin")).toEqual([]);
  });

  it("todo atalho é interno e tem id único", () => {
    expect(NAV_ITEMS.every((item) => item.href.startsWith("/") && !item.href.startsWith("//"))).toBe(true);
    expect(new Set(NAV_ITEMS.map((item) => item.id)).size).toBe(NAV_ITEMS.length);
  });
});
