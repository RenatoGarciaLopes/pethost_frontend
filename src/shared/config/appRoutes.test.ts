import { describe, expect, it } from "vitest";
import {
  forgotPasswordPath,
  homeOf,
  loginRedirectPath,
  refreshRedirectPath,
  registerPath,
  resolvePostLoginPath,
} from "./appRoutes";

describe("appRoutes", () => {
  it("REQ-HTTP-016 refresh e login levam o next seguro", () => {
    expect(refreshRedirectPath("/pets?tab=1")).toBe("/api/auth/sessions/refresh?next=%2Fpets%3Ftab%3D1");
    expect(refreshRedirectPath("//evil.example")).toBe("/api/auth/sessions/refresh?next=%2F");
    expect(loginRedirectPath("/pets")).toBe("/login?next=%2Fpets");
    expect(loginRedirectPath("https://evil.example")).toBe("/login");
  });

  it("REQ-AUTH-001 o login pode vir com a conta marcada", () => {
    expect(loginRedirectPath("/pets", "owner")).toBe("/login?as=owner&next=%2Fpets");
    expect(loginRedirectPath(null, "host")).toBe("/login?as=host");
  });

  it("REQ-OREG-001 cadastro leva o next seguro", () => {
    expect(registerPath()).toBe("/register");
    expect(registerPath(undefined, "/hosts/42")).toBe("/register?next=%2Fhosts%2F42");
    expect(registerPath("owner", "/hosts/42")).toBe("/register/owner?next=%2Fhosts%2F42");
    expect(registerPath("host", "//evil.example")).toBe("/register/host");
  });
});

describe("forgotPasswordPath", () => {
  it("REQ-PWD-001 marca a conta pelo as, inclusive admin", () => {
    expect(forgotPasswordPath()).toBe("/forgot-password");
    expect(forgotPasswordPath("host")).toBe("/forgot-password?as=host");
    expect(forgotPasswordPath("admin")).toBe("/forgot-password?as=admin");
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
