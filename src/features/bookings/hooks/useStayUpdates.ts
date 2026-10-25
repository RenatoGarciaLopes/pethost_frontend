"use client";

import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { seenSnapshots } from "@/shared/lib/seenSnapshots";
import { BOOKING_STATUSES } from "../api/contracts";
import { bookingQueries } from "../api/queries";
import { hasStayUpdates, staySnapshot } from "../lib/stayUpdates";

/** Owner navigation indicator. Shares the list cache, loads all pages, refetches stale data on focus.
 * Visiting the list acknowledges all stays; visiting a detail acknowledges only that stay after loading.
 * Storage/API failures suppress the indicator. Mount with a React key per account.
 * @example const updates = useStayUpdates(accountId, pathname)
 */
export function useStayUpdates(accountId: string, pathname: string): boolean {
  const client = useQueryClient();
  const query = useInfiniteQuery({
    ...bookingQueries.infinite(accountId, BOOKING_STATUSES),
    refetchOnWindowFocus: true,
    enabled: typeof indexedDB !== "undefined",
  });
  const detailId = /^\/owner\/bookings\/([^/]+)$/.exec(pathname)?.[1];
  const detail = useQuery({
    ...bookingQueries.detail(accountId, detailId ?? ""),
    enabled: !!detailId && typeof indexedDB !== "undefined",
  });
  const [result, setResult] = useState({ pathname: "", updatedAt: 0, value: false });
  const { hasNextPage, isFetching, isError, fetchNextPage } = query;

  useEffect(() => {
    const booking = detail.data;
    if (!detailId || !booking || detail.isFetching || detail.isError) return;
    const listKey = bookingQueries.infinite(accountId, BOOKING_STATUSES).queryKey;
    if (detail.dataUpdatedAt < (client.getQueryState(listKey)?.dataUpdatedAt ?? 0)) return;
    // Keep a freshly acknowledged detail from becoming "new" again on an older list cache.
    client.setQueryData(listKey, (old) => {
      if (!old) return old;
      const signature = staySnapshot([booking])[booking.id];
      let changed = false;
      const pages = old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => {
          if (item.id !== booking.id || staySnapshot([item])[item.id] === signature) return item;
          changed = true;
          return booking;
        }),
      }));
      return changed ? { ...old, pages } : old;
    });
  }, [client, accountId, detailId, detail.data, detail.dataUpdatedAt, detail.isFetching, detail.isError]);

  useEffect(() => {
    if (hasNextPage && !isFetching && !isError) void fetchNextPage();
  }, [hasNextPage, isFetching, isError, fetchNextPage]);

  useEffect(() => {
    if (!query.data || query.hasNextPage || query.isFetching || query.isError) return;
    let cancelled = false;
    const current = staySnapshot(query.data.pages.flatMap((page) => page.items));
    const key = `owner-stays:${accountId}`;
    void (async () => {
      const seen = await seenSnapshots.read(key);
      if (cancelled) return;
      let value = false;
      if (seen !== undefined) {
        if (seen === null || pathname === "/owner/bookings") {
          await seenSnapshots.write(key, current);
        } else {
          let acknowledged = seen;
          const detailSignature = detail.data ? staySnapshot([detail.data]) : undefined;
          const detailIsCurrent =
            detailSignature &&
            (detail.dataUpdatedAt >= query.dataUpdatedAt ||
              detailSignature[detailId ?? ""] === current[detailId ?? ""]);
          if (detailId && detail.data && detailIsCurrent && !detail.isFetching && !detail.isError) {
            acknowledged = { ...seen, ...staySnapshot([detail.data]) };
            // Prefer the freshly loaded detail to an older list cache.
            if (detail.dataUpdatedAt >= query.dataUpdatedAt) Object.assign(current, staySnapshot([detail.data]));
            if ((await seenSnapshots.write(key, acknowledged)) === undefined) {
              if (!cancelled) setResult({ pathname, updatedAt: query.dataUpdatedAt, value: false });
              return;
            }
          }
          value = hasStayUpdates(current, acknowledged);
        }
      }
      if (!cancelled) setResult({ pathname, updatedAt: query.dataUpdatedAt, value });
    })();
    return () => {
      cancelled = true;
    };
  }, [
    accountId,
    pathname,
    query.data,
    query.dataUpdatedAt,
    query.hasNextPage,
    query.isFetching,
    query.isError,
    detailId,
    detail.data,
    detail.dataUpdatedAt,
    detail.isFetching,
    detail.isError,
  ]);

  return !query.isError && result.pathname === pathname && result.updatedAt === query.dataUpdatedAt && result.value;
}
