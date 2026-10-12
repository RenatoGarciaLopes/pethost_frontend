import { beforeEach, expect, it, vi } from "vitest";
import { sessionUserFixture } from "@/test/fixtures/session";
import { requireRole } from "./requireRole";
import { currentPath } from "./currentPath";
import { requireSession } from "./getSession";

vi.mock("./getSession", () => ({ requireSession: vi.fn() }));
vi.mock("./currentPath", () => ({ currentPath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`);
  },
}));
beforeEach(() => {
  vi.mocked(requireSession).mockResolvedValue(sessionUserFixture);
  vi.mocked(currentPath).mockResolvedValue("/pets?tab=all");
});
it("REQ-SHELL-010 confirma sessão e aceita lista de papéis", async () => {
  await expect(requireRole(["owner", "host"])).resolves.toEqual(sessionUserFixture);
  expect(requireSession).toHaveBeenCalledWith("/pets?tab=all");
});
it("REQ-SHELL-010 usa caminho explícito sem consultar headers", async () => {
  vi.mocked(currentPath).mockClear();
  await expect(requireRole("owner", "/owner")).resolves.toEqual(sessionUserFixture);
  expect(currentPath).not.toHaveBeenCalled();
  expect(requireSession).toHaveBeenCalledWith("/owner");
});
it.each([
  ["owner", "/"],
  ["host", "/host"],
  ["admin", "/admin/host-applications"],
] as const)("REQ-SHELL-010 redireciona papel incompatível %s à própria casa", async (role, home) => {
  vi.mocked(requireSession).mockResolvedValue({ ...sessionUserFixture, role });
  await expect(requireRole([])).rejects.toThrow(`redirect:${home}`);
});
it("REQ-SHELL-010 propaga ausência de sessão sem liberar área", async () => {
  vi.mocked(requireSession).mockRejectedValue(new Error("redirect:/login"));
  await expect(requireRole("owner")).rejects.toThrow("redirect:/login");
});
