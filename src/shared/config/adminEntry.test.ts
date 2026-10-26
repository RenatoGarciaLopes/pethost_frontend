import { expect, it } from "vitest";
import config from "../../../next.config";
import { homeOf } from "./appRoutes";

it("a entrada /admin encaminha temporariamente para a fila existente", async () => {
  expect(await config.redirects?.()).toContainEqual({
    source: "/admin",
    destination: homeOf("admin"),
    permanent: false,
  });
});
