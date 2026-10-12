import { describe, expect, it, vi } from "vitest";
import { notifySessionExpired, onSessionExpired } from "./sessionEvents";

describe("sessionEvents", () => {
  it("REQ-HTTP-012 avisa quem assinou e para de avisar depois de cancelar", () => {
    const listener = vi.fn();
    const unsubscribe = onSessionExpired(listener);

    notifySessionExpired();
    unsubscribe();
    notifySessionExpired();

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("REQ-HTTP-012 um ouvinte com erro não impede os outros", () => {
    const failing = vi.fn(() => {
      throw new Error("x");
    });
    const healthy = vi.fn();
    const offFailing = onSessionExpired(failing);
    const offHealthy = onSessionExpired(healthy);

    expect(() => notifySessionExpired()).not.toThrow();
    expect(healthy).toHaveBeenCalledTimes(1);
    offFailing();
    offHealthy();
  });
});
