import { afterEach, describe, expect, it, vi } from "vitest";
import { createRefreshSingleFlight } from "./refreshSingleFlight";

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

afterEach(() => vi.useRealTimers());

describe("createRefreshSingleFlight", () => {
  it("REQ-HTTP-011 5 chamadas paralelas com o mesmo token → 1 refresh, todas com o par novo", async () => {
    const pending = deferred<string>();
    const refresh = vi.fn(() => pending.promise);
    const singleFlight = createRefreshSingleFlight(refresh);

    const calls = Array.from({ length: 5 }, () => singleFlight("old-token", undefined));
    pending.resolve("new-pair");

    await expect(Promise.all(calls)).resolves.toEqual(Array(5).fill("new-pair"));
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(refresh).toHaveBeenCalledWith("old-token", undefined);
  });

  it("REQ-HTTP-011 tokens diferentes renovam em paralelo, cada um uma vez", async () => {
    const refresh = vi.fn(async (token: string) => `new-${token}`);
    const singleFlight = createRefreshSingleFlight(refresh);

    await expect(
      Promise.all([singleFlight("a", undefined), singleFlight("b", undefined), singleFlight("a", undefined)]),
    ).resolves.toEqual(["new-a", "new-b", "new-a"]);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("REQ-HTTP-011 requisição atrasada com o token antigo reaproveita o par novo durante a carência", async () => {
    vi.useFakeTimers();
    const refresh = vi.fn(async () => "new-pair");
    const singleFlight = createRefreshSingleFlight(refresh, { graceMs: 10_000 });

    await singleFlight("old-token", undefined);
    await vi.advanceTimersByTimeAsync(9_000);
    await expect(singleFlight("old-token", undefined)).resolves.toBe("new-pair");
    expect(refresh).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2_000);
    await singleFlight("old-token", undefined);
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("REQ-HTTP-012 falha não fica guardada: todas as espera recebem o erro e a próxima tenta de novo", async () => {
    const refresh = vi.fn().mockRejectedValueOnce(new Error("401")).mockResolvedValueOnce("ok");
    const singleFlight = createRefreshSingleFlight(refresh);

    const results = await Promise.allSettled([singleFlight("t", undefined), singleFlight("t", undefined)]);
    expect(results.map((result) => result.status)).toEqual(["rejected", "rejected"]);

    await expect(singleFlight("t", undefined)).resolves.toBe("ok");
    expect(refresh).toHaveBeenCalledTimes(2);
  });
});
