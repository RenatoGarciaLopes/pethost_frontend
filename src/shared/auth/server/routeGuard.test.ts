import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { guardRoute } from "./routeGuard";

describe("guardRoute", () => {
  it.each(["/", "/login", "/admin/login"])("REQ-SHELL-009 permite rota pública %s", (path) => {
    expect(guardRoute(new NextRequest(`http://app.test${path}`))).toBeUndefined();
  });
  it.each([
    ["/host?tab=house", "/login"],
    ["/admin/users", "/admin/login"],
    ["/pets", "/login"],
  ])("REQ-SHELL-009 envia visitante ao login e preserva next: %s", (path, login) => {
    const response = guardRoute(new NextRequest(`http://app.test${path}`));
    const location = new URL(response!.headers.get("location")!);
    expect(location.pathname).toBe(login);
    expect(location.searchParams.get("next")).toBe(path);
    expect(response!.status).toBe(307);
  });
  it.each([
    ["host", "/host", undefined],
    ["owner", "/host", "/"],
    ["admin", "/pets", "/admin/host-applications"],
  ])("REQ-SHELL-009 usa papel apenas como indicação: %s em %s", (role, path, destination) => {
    const token = `e30.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.sig`;
    const request = new NextRequest(`http://app.test${path}`, { headers: { cookie: `pethost_at=${token}` } });
    const response = guardRoute(request);
    if (destination) expect(new URL(response!.headers.get("location")!).pathname).toBe(destination);
    else expect(response).toBeUndefined();
  });
  it.each(["pethost_rt=refresh", "pethost_at=ilegivel"])(
    "REQ-SHELL-009 deixa confirmação para o layout: %s",
    (cookie) => {
      expect(guardRoute(new NextRequest("http://app.test/host", { headers: { cookie } }))).toBeUndefined();
    },
  );
});
