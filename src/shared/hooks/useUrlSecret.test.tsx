import { act, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUrlSecret } from "./useUrlSecret";

beforeEach(() => window.history.replaceState({ etapa: 1 }, "", "/reset-password"));

describe("useUrlSecret", () => {
  it("REQ-PWD-005 permanece indefinido antes de montar no navegador", () => {
    function Probe() {
      return <span>{String(useUrlSecret("token"))}</span>;
    }
    expect(renderToString(<Probe />)).toContain("undefined");
  });
  it("REQ-PWD-005 lê uma vez e limpa query e fragmento preservando history.state", () => {
    window.history.replaceState({ etapa: 2 }, "", "/reset-password?role=host&token=query#token=a%2Bb&passo=2");
    const replace = vi.spyOn(window.history, "replaceState");
    const { result, rerender } = renderHook(() => useUrlSecret("token"), { wrapper: StrictMode });
    expect(result.current).toBe("a+b");
    expect(replace).toHaveBeenCalledExactlyOnceWith({ etapa: 2 }, "", "/reset-password?role=host#passo=2");
    act(() => window.history.pushState(null, "", "/reset-password#token=outro"));
    rerender();
    expect(result.current).toBe("a+b");
    expect(replace).toHaveBeenCalledTimes(1);
  });
  it("REQ-PWD-006 retorna null sem segredo e não altera o histórico", () => {
    const replace = vi.spyOn(window.history, "replaceState");
    const { result } = renderHook(() => useUrlSecret("token"));
    expect(result.current).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
  it("REQ-PWD-005 lê token da query e não o compartilha com uma nova montagem", () => {
    window.history.replaceState(null, "", "/reset-password?token=query%2Bvalor&role=owner#secao");
    const first = renderHook(() => useUrlSecret("token"));
    expect(first.result.current).toBe("query+valor");
    expect(window.location.search + window.location.hash).toBe("?role=owner#secao");
    first.unmount();
    const second = renderHook(() => useUrlSecret("token"));
    expect(second.result.current).toBeNull();
  });
  it("REQ-PWD-013 remove também parâmetros vazios sem persistir o segredo", () => {
    window.history.replaceState(null, "", "/reset-password?token=query#token=");
    const local = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useUrlSecret("token"));
    expect(result.current).toBeNull();
    expect(window.location.search + window.location.hash).toBe("");
    expect(local).not.toHaveBeenCalled();
  });
});
