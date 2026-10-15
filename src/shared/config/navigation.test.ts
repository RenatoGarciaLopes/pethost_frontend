import { describe, expect, it } from "vitest";
import { NAV_ITEMS, navItemsFor } from "./navigation";

describe("REQ-SHELL-002 tabela única de atalhos", () => {
  it("cada papel vê só os seus atalhos", () => {
    expect(navItemsFor("owner").map((item) => item.href)).toEqual(["/pets"]);
    expect(navItemsFor("host").map((item) => item.href)).toEqual(["/host/application", "/pets"]);
    expect(navItemsFor("admin")).toEqual([]);
  });

  it("REQ-HVER-001 anfitrião tem o atalho Minha verificação", () => {
    expect(navItemsFor("host")).toContainEqual({
      id: "host-application",
      label: "Minha verificação",
      href: "/host/application",
      roles: ["host"],
    });
  });

  it("todo atalho é interno e tem id único", () => {
    expect(NAV_ITEMS.every((item) => item.href.startsWith("/") && !item.href.startsWith("//"))).toBe(true);
    expect(new Set(NAV_ITEMS.map((item) => item.id)).size).toBe(NAV_ITEMS.length);
  });
});
it("REQ-HPETS-010 pets da casa fica disponível só para anfitrião", () => {
  expect(navItemsFor("host")).toContainEqual({
    id: "host-pets",
    label: "Pets da casa",
    href: "/pets",
    roles: ["host"],
  });
  expect(navItemsFor("owner").some((item) => item.id === "host-pets")).toBe(false);
  expect(navItemsFor("admin").some((item) => item.id === "host-pets")).toBe(false);
});
