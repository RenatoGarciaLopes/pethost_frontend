import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors/ApiError";
import type { HttpTransport } from "@/shared/api/transport/HttpTransport";
import { createSessionGateway, REFRESH_THRESHOLD_SECONDS } from "./sessionGateway";

const NOW_S = 1_800_000_000;
const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;
const user = {
  id: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
  fullName: "C",
  email: "c@x.co",
  role: "owner",
  isActive: true,
};
const renewed = { accessToken: jwt(NOW_S + 900), refreshToken: "rt-2", expiresAt: NOW_S + 900, user };

function setup(refreshImpl: () => Promise<unknown> = async () => renewed) {
  const request = vi.fn<HttpTransport["request"]>(refreshImpl as HttpTransport["request"]);
  const backend = vi.fn(() => ({ request }));
  const gateway = createSessionGateway({ backend, now: () => NOW_S * 1000 });
  return { gateway, request, backend };
}

describe("resolveAccess", () => {
  it("REQ-HTTP-015 sem cookies é anônimo", async () => {
    const { gateway, request } = setup();

    await expect(gateway.resolveAccess({}, {})).resolves.toEqual({ status: "anonymous" });
    expect(request).not.toHaveBeenCalled();
  });

  it("REQ-HTTP-011 access com folga é usado como está", async () => {
    const { gateway, request } = setup();
    const accessToken = jwt(NOW_S + REFRESH_THRESHOLD_SECONDS + 1);

    await expect(gateway.resolveAccess({ accessToken, refreshToken: "rt" }, {})).resolves.toEqual({
      status: "valid",
      accessToken,
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("REQ-HTTP-011 access a menos de 60 s (ou ausente) renova com o refresh e o IP do cliente", async () => {
    const { gateway, request, backend } = setup();

    const nearExpiry = await gateway.resolveAccess(
      { accessToken: jwt(NOW_S + 30), refreshToken: "rt-1" },
      { forwardedFor: "203.0.113.7" },
    );

    expect(nearExpiry).toEqual({ status: "renewed", accessToken: renewed.accessToken, session: renewed });
    expect(backend).toHaveBeenCalledWith({ forwardedFor: "203.0.113.7" });
    expect(request).toHaveBeenCalledWith(
      { method: "POST", path: "/auth/sessions/refresh", body: { refreshToken: "rt-1" } },
      expect.anything(),
    );
    expect((await setup().gateway.resolveAccess({ refreshToken: "rt-9" }, {})).status).toBe("renewed");
  });

  it("REQ-HTTP-012 refresh recusado (401) → expired", async () => {
    const { gateway } = setup(async () => {
      throw new ApiError({ status: 401, code: "AUTH_REFRESH_TOKEN_INVALID", message: "x" });
    });

    await expect(gateway.resolveAccess({ refreshToken: "rt" }, {})).resolves.toEqual({ status: "expired" });
  });

  it("REQ-HTTP-012 API fora do ar no refresh propaga o erro (não derruba a sessão)", async () => {
    const { gateway } = setup(async () => {
      throw ApiError.networkError(new Error("down"));
    });

    await expect(gateway.resolveAccess({ refreshToken: "rt-down" }, {})).rejects.toMatchObject({
      code: "NETWORK_ERROR",
    });
  });

  it("REQ-HTTP-011 access vencido sem refresh segue como está (a API responde 401)", async () => {
    const { gateway } = setup();
    const accessToken = jwt(NOW_S - 5);

    await expect(gateway.resolveAccess({ accessToken }, {})).resolves.toEqual({ status: "valid", accessToken });
  });
});

describe("forceRefresh", () => {
  it("REQ-HTTP-011 renova mesmo com o access em dia (depois de um 401 da API)", async () => {
    const { gateway, request } = setup();

    await expect(gateway.forceRefresh("rt-force", {})).resolves.toMatchObject({ status: "renewed" });
    expect(request).toHaveBeenCalledTimes(1);
  });

  it("REQ-HTTP-012 sem refresh token → expired", async () => {
    await expect(setup().gateway.forceRefresh(undefined, {})).resolves.toEqual({ status: "expired" });
  });
});
