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
});

it("REQ-NEARBY-018 mock do visitante segue a API real: sem filtro lista todos, raio fora do mapa vem vazio", async () => {
  server.use(...searchHandlers);
  const anonymous = async (query: string) => fetch(`http://localhost:5099/api/v1/listings?${query}`);
  const all = await (await anonymous("pageSize=6")).json();
  expect(GetApiV1ListingsResponse.safeParse(all).success).toBe(true);
  expect(all.data.totalCount).toBe(13);
  expect(all.data.items).toHaveLength(6);
  expect(all.data.items.every((item: { distanceKm?: number }) => item.distanceKm === undefined)).toBe(true);
  const near = await (await anonymous("latitude=-23.43&longitude=-51.94&radiusKm=10")).json();
  expect(near.data.totalCount).toBe(13);
  expect(near.data.items[0].distanceKm).toBeTypeOf("number");
  expect((await (await anonymous("latitude=-3.73&longitude=-38.52&radiusKm=10")).json()).data.totalCount).toBe(0);
  expect((await anonymous("radiusKm=10")).status).toBe(422);
});
