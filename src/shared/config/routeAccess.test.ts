import { describe, expect, it } from "vitest";
import { accessFor } from "./routeAccess";

describe("accessFor", () => {
  it.each(["/", "/listings/abc", "/login", "/admin/login", "/register/owner", "/forgot-password", "/reset-password"])(
    "REQ-SHELL-009 %s é público",
    (path) => {
      expect(accessFor(path)).toEqual({ kind: "public" });
    },
  );

  it("REQ-SHELL-009 áreas de cada papel", () => {
    expect(accessFor("/host/application")).toEqual({ kind: "protected", roles: ["host"], loginPath: "/login" });
    expect(accessFor("/host")).toMatchObject({ roles: ["host"] });
    expect(accessFor("/owner/bookings")).toMatchObject({ roles: ["owner"] });
    expect(accessFor("/pets/123/edit")).toMatchObject({ roles: ["owner", "host"] });
    expect(accessFor("/users/profile")).toMatchObject({ roles: ["owner", "host"] });
    expect(accessFor("/conversations")).toMatchObject({ roles: ["owner", "host"] });
  });

  it("REQ-SHELL-011 admin tem login próprio", () => {
    expect(accessFor("/admin/host-applications")).toEqual({
      kind: "protected",
      roles: ["admin"],
      loginPath: "/admin/login",
    });
  });

  it("REQ-SHELL-009 prefixo parecido não engana", () => {
    expect(accessFor("/hosting-tips")).toEqual({ kind: "public" });
    expect(accessFor("/petshop")).toEqual({ kind: "public" });
  });
});
