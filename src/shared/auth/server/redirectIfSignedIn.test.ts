import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionUserFixture } from "@/test/fixtures/session";
import { redirectIfSignedIn } from "./redirectIfSignedIn";

const { connection, getSession, redirect } = vi.hoisted(() => ({
  connection: vi.fn(async () => undefined),
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock("./getSession", () => ({ getSession }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/server", () => ({ connection }));

describe("redirectIfSignedIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("REQ-OREG-015 sem sessão, a tela aparece", async () => {
    getSession.mockResolvedValue(null);
    await expect(redirectIfSignedIn("/hosts/42")).resolves.toBeUndefined();
    expect(connection).toHaveBeenCalledOnce();
    expect(connection.mock.invocationCallOrder[0]).toBeLessThan(getSession.mock.invocationCallOrder[0]);
    expect(redirect).not.toHaveBeenCalled();
  });

  it("REQ-OREG-015 com sessão, vai para o next seguro", async () => {
    getSession.mockResolvedValue(sessionUserFixture);
    await expect(redirectIfSignedIn("/hosts/42")).rejects.toThrow("NEXT_REDIRECT /hosts/42");
  });

  it("REQ-AUTH-014 com sessão e next inseguro, vai para a casa do papel", async () => {
    getSession.mockResolvedValue({ ...sessionUserFixture, role: "host" });
    await expect(redirectIfSignedIn("https://evil.example")).rejects.toThrow("NEXT_REDIRECT /host");
  });
});
