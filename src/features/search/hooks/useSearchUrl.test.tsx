import { act, renderHook } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { useSearchUrl } from "./useSearchUrl";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(window.location.search) }));

it("nova busca atualiza o histórico e volta ao topo sem rolagem suave", () => {
  const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  const { result } = renderHook(() => useSearchUrl());
  expect(scroll).not.toHaveBeenCalled();
  try {
    act(() => result.current.update({ where: "Maringá", pets: [], species: [], sizes: [] }));
    expect(new URLSearchParams(window.location.search).get("where")).toBe("Maringá");
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 0, left: 0, behavior: "instant" });
  } finally {
    window.history.replaceState(null, "", "/");
  }
});
