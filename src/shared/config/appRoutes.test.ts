import { describe, expect, it } from "vitest";
import { homeOf, loginRedirectPath, refreshRedirectPath, resolvePostLoginPath } from "./appRoutes";

describe("appRoutes", () => {
  it("REQ-HTTP-016 refresh e login levam o next seguro", () => {
    expect(refreshRedirectPath("/pets?tab=1")).toBe("/api/auth/sessions/refresh?next=%2Fpets%3Ftab%3D1");
    expect(refreshRedirectPath("//evil.example")).toBe("/api/auth/sessions/refresh?next=%2F");
    expect(loginRedirectPath("/pets")).toBe("/login?next=%2Fpets");
    expect(loginRedirectPath("https://evil.example")).toBe("/login");
  });
});

describe("casa do papel", () => {
  it("REQ-SHELL-016 tutor → /, anfitrião → /host, admin → fila de verificação", () => {
    expect(homeOf("owner")).toBe("/");
    expect(homeOf("host")).toBe("/host");
    expect(homeOf("admin")).toBe("/admin/host-applications");
  });

  it("REQ-SHELL-016 depois do login, next seguro vence; inseguro cai na casa", () => {
    expect(resolvePostLoginPath("host", "/host/application")).toBe("/host/application");
    expect(resolvePostLoginPath("host", "https://evil.example")).toBe("/host");
    expect(resolvePostLoginPath("owner", null)).toBe("/");
    expect(resolvePostLoginPath("admin", "/api/users/me")).toBe("/admin/host-applications");
  });
});
