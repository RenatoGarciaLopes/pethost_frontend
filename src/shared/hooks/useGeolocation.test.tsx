import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useGeolocation } from "./useGeolocation";

type Success = (position: GeolocationPosition) => void;
type Failure = (error: GeolocationPositionError) => void;

function stubBrowser({
  position,
  error,
  permission,
}: {
  position?: { latitude: number; longitude: number };
  error?: number;
  permission?: PermissionState;
}) {
  const getCurrentPosition = vi.fn((ok: Success, fail: Failure) => {
    if (error) fail({ code: error } as GeolocationPositionError);
    else ok({ coords: position } as GeolocationPosition);
  });
  vi.stubGlobal("navigator", {
    geolocation: { getCurrentPosition },
    permissions: permission ? { query: vi.fn().mockResolvedValue({ state: permission }) } : undefined,
  });
  return getCurrentPosition;
}

afterEach(() => vi.unstubAllGlobals());

it("REQ-NEARBY-001 não pede a posição antes do gesto e arredonda para cerca de 1 km", () => {
  const getCurrentPosition = stubBrowser({ position: { latitude: -23.42512, longitude: -51.93878 } });
  const { result } = renderHook(() => useGeolocation());
  expect(result.current.status).toBe("idle");
  expect(getCurrentPosition).not.toHaveBeenCalled();
  act(() => result.current.request());
  expect(result.current.status).toBe("granted");
  expect(result.current.coords).toEqual({ latitude: -23.43, longitude: -51.94 });
});

it("REQ-NEARBY-002 permissão negada vira denied e outras falhas viram failed", () => {
  stubBrowser({ error: 1 });
  const denied = renderHook(() => useGeolocation());
  act(() => denied.result.current.request());
  expect(denied.result.current.status).toBe("denied");
  expect(denied.result.current.coords).toBeNull();

  stubBrowser({ error: 3 });
  const failed = renderHook(() => useGeolocation());
  act(() => failed.result.current.request());
  expect(failed.result.current.status).toBe("failed");
});

it("REQ-NEARBY-003 navegador sem geolocalização fica unavailable", () => {
  vi.stubGlobal("navigator", {});
  const { result } = renderHook(() => useGeolocation());
  act(() => result.current.request());
  expect(result.current.status).toBe("unavailable");
});

it("REQ-NEARBY-004 permissão já concedida busca sozinha, sem novo gesto", async () => {
  stubBrowser({ position: { latitude: -23.4, longitude: -51.9 }, permission: "granted" });
  const { result } = renderHook(() => useGeolocation());
  await waitFor(() => expect(result.current.status).toBe("granted"));
  expect(result.current.coords).toEqual({ latitude: -23.4, longitude: -51.9 });
});

it("REQ-NEARBY-004 permissão ainda não decidida espera o gesto", async () => {
  const getCurrentPosition = stubBrowser({ position: { latitude: 1, longitude: 1 }, permission: "prompt" });
  const { result } = renderHook(() => useGeolocation());
  await Promise.resolve();
  expect(result.current.status).toBe("idle");
  expect(getCurrentPosition).not.toHaveBeenCalled();
});
