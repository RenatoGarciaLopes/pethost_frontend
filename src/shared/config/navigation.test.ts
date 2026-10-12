import { describe, expect, it } from "vitest";
import { NAV_ITEMS, navItemsFor, type NavItem } from "./navigation";

const sample: NavItem[] = [
  { id: "pets", label: "Meus pets", href: "/pets", roles: ["owner", "host"], spec: "020", available: true },
  { id: "search", label: "Buscar", href: "/search", roles: ["owner"], spec: "041", available: false },
  {
    id: "queue",
    label: "Verificações",
    href: "/admin/host-applications",
    roles: ["admin"],
    spec: "031",
    available: true,
  },
];

describe("navItemsFor", () => {
  it("REQ-SHELL-002 cada papel vê só os próprios atalhos, na ordem da tabela", () => {
    expect(navItemsFor("owner", sample).map((item) => item.id)).toEqual(["pets"]);
    expect(navItemsFor("host", sample).map((item) => item.id)).toEqual(["pets"]);
    expect(navItemsFor("admin", sample).map((item) => item.id)).toEqual(["queue"]);
  });

  it("REQ-SHELL-002 tela ainda não implementada não aparece", () => {
    expect(navItemsFor("owner", sample).some((item) => item.id === "search")).toBe(false);
  });
});

describe("NAV_ITEMS", () => {
  it("REQ-SHELL-002 todo href é interno e todo id é único", () => {
    for (const item of NAV_ITEMS) expect(item.href).toMatch(/^\/(?!\/)/);
    expect(new Set(NAV_ITEMS.map((item) => item.id)).size).toBe(NAV_ITEMS.length);
  });

  it("REQ-SHELL-002 admin nunca divide atalho com tutor ou anfitrião", () => {
    for (const item of NAV_ITEMS.filter((entry) => entry.roles.includes("admin"))) {
      expect(item.roles).toEqual(["admin"]);
    }
  });
});
