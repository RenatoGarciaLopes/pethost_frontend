import { afterEach, describe, expect, it, vi } from "vitest";
import { seenSnapshots } from "./seenSnapshots";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

/** Minimal event-driven native boundary double, private to this adapter test. */
function storage(value?: unknown, abort = false) {
  const operation = { result: value };
  const store = { get: vi.fn(() => operation), put: vi.fn(() => operation) };
  const transaction = { objectStore: () => store, oncomplete: () => {}, onabort: () => {}, onerror: () => {} };
  const db = {
    close: vi.fn(),
    createObjectStore: vi.fn(),
    transaction: vi.fn(() => {
      queueMicrotask(() => (abort ? transaction.onabort() : transaction.oncomplete()));
      return transaction;
    }),
  };
  const request = {
    result: db,
    onsuccess: () => {},
    onerror: () => {},
    onblocked: () => {},
    onupgradeneeded: () => {},
  };
  vi.stubGlobal("indexedDB", {
    open: vi.fn(() => {
      queueMicrotask(() => {
        request.onupgradeneeded();
        request.onsuccess();
      });
      return request;
    }),
  });
  return { store, db, request };
}

describe("seenSnapshots", () => {
  it("reads a missing snapshot and closes the database", async () => {
    const { db } = storage();
    expect(await seenSnapshots.read("owner-stays:a")).toBeNull();
    expect(db.close).toHaveBeenCalled();
    expect(db.createObjectStore).toHaveBeenCalledWith("snapshots");
  });
  it("preserves account keys and waits for commit", async () => {
    const { store } = storage({ booking: "signature" });
    expect(await seenSnapshots.read("owner-stays:a")).toEqual({ booking: "signature" });
    expect(store.get).toHaveBeenCalledWith("owner-stays:a");
    expect(await seenSnapshots.write("owner-stays:b", { other: "new" })).toEqual({ other: "new" });
    expect(store.put).toHaveBeenCalledWith({ other: "new" }, "owner-stays:b");
  });
  it("suppresses missing, throwing, aborted, blocked and invalid storage", async () => {
    vi.stubGlobal("indexedDB", undefined);
    expect(await seenSnapshots.read("a")).toBeUndefined();
    vi.stubGlobal("indexedDB", {
      open: () => {
        throw new Error("private");
      },
    });
    expect(await seenSnapshots.write("a", {})).toBeUndefined();
    storage({}, true);
    expect(await seenSnapshots.write("a", {})).toBeUndefined();
    storage({ bad: 12 });
    expect(await seenSnapshots.read("a")).toBeUndefined();
    const blocked = { onblocked: () => {} };
    vi.stubGlobal("indexedDB", {
      open: () => {
        queueMicrotask(() => blocked.onblocked());
        return blocked;
      },
    });
    expect(await seenSnapshots.read("a")).toBeUndefined();
    const failure = { onerror: () => {} };
    vi.stubGlobal("indexedDB", {
      open: () => {
        queueMicrotask(() => failure.onerror());
        return failure;
      },
    });
    expect(await seenSnapshots.read("a")).toBeUndefined();
    vi.useFakeTimers();
    vi.stubGlobal("indexedDB", { open: () => ({}) });
    const pending = seenSnapshots.read("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(await pending).toBeUndefined();
  });
});
