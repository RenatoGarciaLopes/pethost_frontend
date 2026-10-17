import { expect, it, vi } from "vitest";
import { createQueryClient } from "@/shared/api/query/queryClient";
import { listingPageQueries } from "./queries";

it("REQ-LPAGE-001 requests detail by the real API route", async () => {
  const calls: unknown[] = [];
  const request = vi.fn(async (input: { method: string; path: string }) => {
    calls.push(input);
    return {};
  });
  const transport = { request };
  const client = createQueryClient();
  await listingPageQueries.detail("account-id", "listing-id", transport).queryFn!({
    client,
    signal: new AbortController().signal,
    queryKey: ["account", "account-id"],
    meta: undefined,
  });
  expect(calls).toHaveLength(1);
  expect(calls[0]).toMatchObject({ method: "GET", path: "/listings/listing-id" });
});
