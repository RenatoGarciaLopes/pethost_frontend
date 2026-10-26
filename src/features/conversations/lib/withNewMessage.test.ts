import { expect, it } from "vitest";
import { messageDto } from "@/test/fixtures/conversations";
import { toMessage } from "../api/mappers";
import { messageDtoSchema } from "../api/contracts";
import { withNewMessage } from "./withNewMessage";

it("mantém cursores, ordena novas mensagens e deduplica eventos/REST inclusive em páginas antigas", () => {
  const old = toMessage(messageDtoSchema.parse(messageDto({ createdAt: "2026-12-20T10:00:00Z" })));
  const latest = { ...old, id: "latest", createdAt: "2026-12-21T10:00:00Z" };
  const data = {
    pages: [
      { items: [latest], hasMore: true },
      { items: [old], hasMore: false },
    ],
    pageParams: [null, "cursor"],
  };
  expect(withNewMessage(data, old)).toBe(data);
  const middle = { ...old, id: "middle", createdAt: "2026-12-21T09:00:00Z" };
  const merged = withNewMessage(data, middle)!;
  expect(merged.pages[0].items.map((item) => item.id)).toEqual(["latest", "middle"]);
  expect(merged.pages[1]).toBe(data.pages[1]);
  expect(merged.pageParams).toBe(data.pageParams);
  expect(withNewMessage(merged, middle)).toBe(merged);
  expect(withNewMessage(undefined, latest)).toBeUndefined();
});
