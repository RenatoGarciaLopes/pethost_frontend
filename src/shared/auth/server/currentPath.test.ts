import { expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { CURRENT_PATH_HEADER } from "../contracts/requestHeaders";
import { currentPath } from "./currentPath";
vi.mock("next/headers", () => ({ headers: vi.fn() }));
it.each([
  ["/pets?tab=all", "/pets?tab=all"],
  [null, "/"],
  ["https://outside.test", "/"],
  ["//outside.test", "/"],
  ["/api/users", "/"],
])("REQ-SHELL-009 lê caminho seguro do cabeçalho interno: %s", async (value, expected) => {
  const requestHeaders = new Headers();
  if (value !== null) requestHeaders.set(CURRENT_PATH_HEADER, value);
  vi.mocked(headers).mockResolvedValue(requestHeaders as Awaited<ReturnType<typeof headers>>);
  await expect(currentPath()).resolves.toBe(expected);
});
