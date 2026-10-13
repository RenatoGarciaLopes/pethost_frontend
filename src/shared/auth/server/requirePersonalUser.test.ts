import { beforeEach, expect, it, vi } from "vitest";
import { connection } from "next/server";
import { sessionUserFixture } from "@/test/fixtures/session";
import { requirePersonalUser } from "./requirePersonalUser";
import { requireRole } from "./requireRole";

vi.mock("next/server", () => ({ connection: vi.fn() }));
vi.mock("./requireRole", () => ({ requireRole: vi.fn() }));
beforeEach(() => {
  vi.mocked(connection).mockReset().mockResolvedValue(undefined);
  vi.mocked(requireRole).mockReset();
});

it.each(["owner", "host"] as const)(
  "REQ-SWITCH-001 REQ-ACC-001 aguarda a requisição e devolve a conta de %s",
  async (role) => {
    vi.mocked(requireRole).mockImplementation(async () => {
      expect(connection).toHaveBeenCalledOnce();
      return { ...sessionUserFixture, role };
    });

    await expect(requirePersonalUser("/users/password")).resolves.toEqual({ ...sessionUserFixture, role });
    expect(requireRole).toHaveBeenCalledWith(["owner", "host"], "/users/password");
  },
);

it("REQ-ACC-001 admin segue o redirecionamento do requireRole", async () => {
  vi.mocked(requireRole).mockRejectedValue(new Error("redirect:/admin/host-applications"));
  await expect(requirePersonalUser("/users/profile")).rejects.toThrow("redirect:/admin/host-applications");
});
