import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";
import { createBffClient } from "@/shared/api/client/bffClient";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { logoutBestEffort } from "./logoutBestEffort";
const transport = createBffClient({ baseUrl: "http://bff.test/api" });
it("REQ-ACC-024 encerra pelo BFF sem corpo e com proteção CSRF", async () => {
  let calls = 0;
  server.use(
    http.post("*/api/auth/sessions/logout", async ({ request }) => {
      calls++;
      expect(await request.text()).toBe("");
      expect(request.headers.get("x-pethost-request")).toBe("1");
      return HttpResponse.json(apiOk({}));
    }),
  );
  await expect(logoutBestEffort(transport)).resolves.toBeUndefined();
  expect(calls).toBe(1);
});
it.each(["http", "rede"])("REQ-ACC-024 falha de logout %s não impede limpeza posterior", async (failure) => {
  server.use(
    http.post("*/api/auth/sessions/logout", () =>
      failure === "rede" ? HttpResponse.error() : HttpResponse.json({}, { status: 503 }),
    ),
  );
  await expect(logoutBestEffort(transport)).resolves.toBeUndefined();
});
