/** Snapshot of opaque signatures, scoped by feature and account. No personal booking data. */
export type SeenSnapshot = Record<string, string>;

/** Native IndexedDB adapter. `undefined` means unavailable; `null` means first visit.
 * Resolves writes only on transaction commit. Blocked/private storage fails silently.
 * @example await seenSnapshots.read(`owner-stays:${accountId}`)
 */
export const seenSnapshots = {
  read: (key: string) => access(key),
  write: (key: string, snapshot: SeenSnapshot) => access(key, snapshot),
};

function access(key: string, snapshot?: SeenSnapshot): Promise<SeenSnapshot | null | undefined> {
  return new Promise((resolve) => {
    let db: IDBDatabase | undefined;
    let settled = false;
    const finish = (value?: SeenSnapshot | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      db?.close();
      resolve(value);
    };
    const timer = setTimeout(() => finish(), 2000);
    try {
      const request = indexedDB.open("pethost-seen", 1);
      request.onupgradeneeded = () => request.result.createObjectStore("snapshots");
      request.onerror = request.onblocked = () => finish();
      request.onsuccess = () => {
        db = request.result;
        if (settled) {
          db.close();
          return;
        }
        try {
          const transaction = db.transaction("snapshots", snapshot ? "readwrite" : "readonly");
          const store = transaction.objectStore("snapshots");
          const operation = snapshot ? store.put(snapshot, key) : store.get(key);
          transaction.onerror = transaction.onabort = () => finish();
          transaction.oncomplete = () => {
            const value: unknown = snapshot ?? operation.result;
            if (value === undefined) finish(null);
            else if (
              value &&
              typeof value === "object" &&
              !Array.isArray(value) &&
              Object.values(value).every((v) => typeof v === "string")
            )
              finish(value as SeenSnapshot);
            else finish();
          };
        } catch {
          finish();
        }
      };
    } catch {
      finish();
    }
  });
}
