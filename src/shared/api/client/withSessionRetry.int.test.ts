import { http, HttpResponse } from "msw";
import { expect, it, vi } from "vitest";
import { ApiError } from "../errors/ApiError";
import { apiFail, apiOk, sessionUserFixture } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createBffClient } from "./bffClient";
const transport = createBffClient({ baseUrl: "http://localhost/api" });
import { withSessionRetry } from "./withSessionRetry";
import { onSessionExpired } from "@/shared/auth/client/sessionEvents";
const unauthorized = () => new ApiError({ status: 401, code: "UNAUTHORIZED", message: "unauthorized" });
it("REQ-PNEW-019 renova pelo BFF uma vez e repete a operação", async () => {
  let refresh = 0;
  server.use(
    http.post("*/api/auth/sessions/refresh", ({ request }) => {
      refresh++;
      expect(request.headers.get("x-pethost-request")).toBe("1");
      return HttpResponse.json(apiOk({ user: sessionUserFixture }));
    }),
  );
  const send = vi.fn().mockRejectedValueOnce(unauthorized()).mockResolvedValue("foto");
  expect(await withSessionRetry(send, transport)).toBe("foto");
  expect(send).toHaveBeenCalledTimes(2);
  expect(refresh).toBe(1);
});
it.each([
  [401, "SESSION_EXPIRED"],
  [503, "UNEXPECTED_ERROR"],
])("REQ-PNEW-019 renovação falhando com %s vira sessão vencida", async (status, code) => {
  const expired = vi.fn();
  const unsubscribe = onSessionExpired(expired);
  server.use(
    http.post("*/api/auth/sessions/refresh", () =>
      HttpResponse.json(apiFail(String(code)), { status: Number(status) }),
    ),
  );
  const send = vi.fn().mockRejectedValue(unauthorized());
  try {
    await expect(withSessionRetry(send, transport)).rejects.toMatchObject({ code: "SESSION_EXPIRED", status: 401 });
    expect(send).toHaveBeenCalledTimes(1);
    expect(expired).toHaveBeenCalledTimes(1);
  } finally {
    unsubscribe();
  }
});
it("REQ-PNEW-019 segundo 401 não entra em ciclo e outros erros não renovam", async () => {
  let refresh = 0;
  server.use(
    http.post("*/api/auth/sessions/refresh", () => {
      refresh++;
      return HttpResponse.json(apiOk({ user: sessionUserFixture }));
    }),
  );
  const send = vi.fn().mockRejectedValue(unauthorized());
  await expect(withSessionRetry(send, transport)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  expect(send).toHaveBeenCalledTimes(2);
  expect(refresh).toBe(1);
  const forbidden = new ApiError({ status: 403, code: "FORBIDDEN", message: "forbidden" });
  await expect(withSessionRetry(() => Promise.reject(forbidden), transport)).rejects.toBe(forbidden);
  expect(refresh).toBe(1);
});
