import { beforeEach, describe, expect, it, vi } from "vitest";
import { sessionUserFixture } from "@/test/fixtures/session";
import { redirectIfSignedIn } from "./redirectIfSignedIn";

const { getSession, redirect, connection } = vi.hoisted(() => ({
  getSession: vi.fn(),
  connection: vi.fn(async () => {}),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));
vi.mock("./getSession", () => ({ getSession }));
vi.mock("next/navigation", () => ({ redirect }));
vi.mock("next/server", () => ({ connection }));

describe("redirectIfSignedIn", () => {
  beforeEach(() => vi.clearAllMocks());

  it("REQ-AUTH-014 waits for the request before reading the session clock", async () => {
    let releaseRequest!: () => void;
    connection.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          releaseRequest = resolve;
        }),
    );
    getSession.mockResolvedValue(null);
    const pending = redirectIfSignedIn(null);
    expect(connection).toHaveBeenCalledOnce();
    expect(getSession).not.toHaveBeenCalled();
    releaseRequest();
    await pending;
    expect(getSession).toHaveBeenCalledOnce();
  });

  it("REQ-OREG-015 sem sessão, a tela aparece", async () => {
    getSession.mockResolvedValue(null);
    await expect(redirectIfSignedIn("/hosts/42")).resolves.toBeUndefined();
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
