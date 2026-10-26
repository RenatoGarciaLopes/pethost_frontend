import { beforeEach, expect, it, vi } from "vitest";
import { cookies, headers } from "next/headers";
import { backendForRequest } from "./backendForRequest";
import { createBackendClient } from "./backendClient";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));
vi.mock("./backendClient", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./backendClient")>()),
  createBackendClient: vi.fn(() => ({ request: vi.fn() })),
}));

beforeEach(() => {
  vi.mocked(cookies).mockResolvedValue({
    get: (name: string) => (name === "pethost_at" ? { name, value: "access-1" } : undefined),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
  vi.mocked(headers).mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }));
});

it("REQ-HTTP-018 REQ-PETS-006 cliente do backend com o access do cookie e o IP de quem pediu", async () => {
  await backendForRequest();
  expect(createBackendClient).toHaveBeenCalledWith({ accessToken: "access-1", forwardedFor: "203.0.113.7, 10.0.0.1" });
});
