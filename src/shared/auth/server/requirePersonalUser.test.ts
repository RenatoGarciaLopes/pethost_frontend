import { beforeEach, expect, it, vi } from "vitest";
import { sessionUserFixture } from "@/test/fixtures/session";
import { requirePersonalUser } from "./requirePersonalUser";
import { requireRole } from "./requireRole";

vi.mock("./requireRole", () => ({ requireRole: vi.fn() }));
beforeEach(() => {
  vi.mocked(requireRole).mockReset();
});

it.each(["owner", "host"] as const)(
  "REQ-SWITCH-001 REQ-ACC-001 devolve a conta de %s pelo requireRole (que espera a requisição)",
  async (role) => {
    vi.mocked(requireRole).mockResolvedValue({ ...sessionUserFixture, role });

    await expect(requirePersonalUser("/users/password")).resolves.toEqual({ ...sessionUserFixture, role });
    expect(requireRole).toHaveBeenCalledWith(["owner", "host"], "/users/password");
  },
);

it("REQ-ACC-001 admin segue o redirecionamento do requireRole", async () => {
  vi.mocked(requireRole).mockRejectedValue(new Error("redirect:/admin/host-applications"));
  await expect(requirePersonalUser("/users/profile")).rejects.toThrow("redirect:/admin/host-applications");
});
