import { StrictMode } from "react";
import { renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { useObjectUrl } from "./useObjectUrl";
afterEach(() => vi.unstubAllGlobals());
function setup() {
  const createObjectURL = vi
    .fn()
    .mockReturnValueOnce("blob:primeira")
    .mockReturnValueOnce("blob:segunda")
    .mockReturnValue("blob:terceira");
  const revokeObjectURL = vi.fn();
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  return { createObjectURL, revokeObjectURL };
}
it("REQ-ACC-026 troca a prévia e revoga ao limpar e desmontar", () => {
  const urls = setup();
  const one = new File(["a"], "a.png");
  const two = new File(["b"], "b.png");
  const { result, rerender, unmount } = renderHook(({ file }) => useObjectUrl(file), {
    initialProps: { file: null as File | null },
  });
  expect(result.current).toBeNull();
  expect(urls.createObjectURL).not.toHaveBeenCalled();
  rerender({ file: one });
  expect(result.current).toBe("blob:primeira");
  rerender({ file: one });
  expect(urls.createObjectURL).toHaveBeenCalledOnce();
  rerender({ file: two });
  expect(result.current).toBe("blob:segunda");
  expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:primeira");
  rerender({ file: null });
  expect(result.current).toBeNull();
  expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:segunda");
  rerender({ file: one });
  unmount();
  expect(urls.revokeObjectURL).toHaveBeenCalledWith("blob:terceira");
});
it("REQ-ACC-026 StrictMode não deixa URLs vivas após desmontar", () => {
  const urls = setup();
  const file = new File(["a"], "a.png");
  const { result, unmount } = renderHook(() => useObjectUrl(file), { wrapper: StrictMode });
  expect(result.current).toMatch(/^blob:/);
  unmount();
  expect(urls.revokeObjectURL.mock.calls.map(([url]) => url)).toEqual(
    urls.createObjectURL.mock.results.map(({ value }) => value),
  );
});
it("REQ-ACC-026 SSR não cria object URL", () => {
  const urls = setup();
  function Preview() {
    return <span>{useObjectUrl(new File(["a"], "a.png")) ?? "sem prévia"}</span>;
  }
  expect(renderToString(<Preview />)).toContain("sem prévia");
  expect(urls.createObjectURL).not.toHaveBeenCalled();
});
