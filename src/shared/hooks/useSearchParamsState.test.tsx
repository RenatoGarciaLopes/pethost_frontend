import { renderHook, act } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { z } from "zod";
import { useSearchParamsState } from "./useSearchParamsState";
const push = vi.hoisted(() => vi.fn());
const navigation = vi.hoisted(() => ({ search: "status=wrong&page=2&keep=yes" }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/queue",
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(navigation.search),
}));
it("REQ-AQUEUE-002/003 valida leitura e preserva parâmetros alheios ao atualizar URL", () => {
  const schema = z.object({
    status: z.enum(["submitted", "approved"]).catch("submitted"),
    page: z.coerce.number().int().positive().catch(1),
  });
  const { result } = renderHook(() => useSearchParamsState(schema));
  expect(result.current[0]).toEqual({ status: "submitted", page: 2 });
  act(() => result.current[1]({ status: "approved", page: 1 }));
  expect(push).toHaveBeenCalledWith("/queue?status=approved&page=1&keep=yes", { scroll: false });
});
it("REQ-AQUEUE-002 parâmetros repetidos e navegação voltar usam a mesma leitura do servidor", () => {
  const schema = z.object({ status: z.enum(["submitted", "approved"]).catch("submitted") });
  navigation.search = "status=submitted&status=approved";
  try {
    const { result, rerender } = renderHook(() => useSearchParamsState(schema));
    expect(result.current[0].status).toBe("submitted");
    navigation.search = "status=approved";
    rerender();
    expect(result.current[0].status).toBe("approved");
    navigation.search = "status=submitted";
    rerender();
    expect(result.current[0].status).toBe("submitted");
  } finally {
    navigation.search = "status=wrong&page=2&keep=yes";
  }
});
