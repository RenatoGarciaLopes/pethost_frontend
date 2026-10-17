import { expect, it } from "vitest";
import { searchHandlers } from "../../../e2e/support/handlers/search.mjs";
import { issueSession } from "../../../e2e/support/handlers/session.mjs";
import { switchAccounts } from "../../../e2e/support/handlers/switchAccounts.mjs";
import { GetApiV1ListingsResponse } from "@/shared/api/generated/listings/listings.zod";
import { server } from "./server";

it("REQ-SRCH-006/007/009 mock autenticado respeita contrato, filtros e páginas", async () => {
  server.use(...searchHandlers);
  const { accessToken } = issueSession(switchAccounts[0]!.user);
  const call = (query: string) =>
    fetch(`http://localhost:5099/api/v1/listings?${query}`, { headers: { authorization: `Bearer ${accessToken}` } });
  const first = await (await call("page=1&pageSize=12")).json();
  expect(GetApiV1ListingsResponse.safeParse(first).success).toBe(true);
  expect(first.data.items).toHaveLength(12);
  expect(first.data.totalCount).toBe(13);
  expect((await (await call("page=2&pageSize=12")).json()).data.items).toHaveLength(1);
  expect(
    (await (await call("hasYard=true")).json()).data.items.every((item: { hasYard: boolean }) => item.hasYard),
  ).toBe(true);
  expect((await (await call("city=Curitiba")).json()).data.totalCount).toBe(0);
  expect((await call("city=Inv%C3%A1lida")).status).toBe(400);
  expect((await call("city=Sem+endere%C3%A7o")).status).toBe(422);
  expect((await call("city=Indispon%C3%ADvel")).status).toBe(503);
  expect((await fetch("http://localhost:5099/api/v1/listings")).status).toBe(401);
});
