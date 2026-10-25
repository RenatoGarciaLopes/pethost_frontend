import { act, screen, waitFor, within } from "@testing-library/react";
import { focusManager } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BOOKING_STATUSES, type Booking } from "@/features/bookings/index";
import { bookingQueries } from "@/features/bookings/index.client";
import { navItemsFor } from "@/shared/config/navigation";
import { seenSnapshots, type SeenSnapshot } from "@/shared/lib/seenSnapshots";
import { quintalTheme } from "@/shared/theme/createQuintalTheme";
import { bookingDto, bookingPageDto } from "@/test/fixtures/bookings";
import { apiOk } from "@/test/fixtures/session";
import { server } from "@/test/msw/server";
import { createTestQueryClient, renderWithProviders } from "@/test/render";
import { OwnerHeaderNav } from "./OwnerHeaderNav";

const navigation = vi.hoisted(() => ({ pathname: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("@/shared/lib/seenSnapshots", () => ({ seenSnapshots: { read: vi.fn(), write: vi.fn() } }));

let saved: Map<string, SeenSnapshot>;
const key = "owner-stays:a";
const current = () => ({ [bookingDto().id]: '["requested","2026-12-11T12:00:00+00:00",null,null,null,null,null]' });
const renderNav = () =>
  renderWithProviders(<OwnerHeaderNav accountId="a" items={navItemsFor("owner")} />, { theme: quintalTheme });
beforeEach(() => {
  navigation.pathname = "/";
  vi.stubGlobal("indexedDB", {});
  saved = new Map();
  vi.mocked(seenSnapshots.read).mockImplementation(async (key) => saved.get(key) ?? null);
  vi.mocked(seenSnapshots.write).mockImplementation(async (key, snapshot) => {
    saved.set(key, snapshot);
    return snapshot;
  });
  server.use(http.get("*/api/bookings/me", () => HttpResponse.json(apiOk(bookingPageDto()))));
});
afterEach(() => {
  vi.unstubAllGlobals();
  focusManager.setFocused(undefined);
});

describe("owner stays navigation", () => {
  it("first visit persists silently and returning unchanged stays silent", async () => {
    const view = renderNav();
    await waitFor(() => expect(saved.get(key)).toEqual(current()));
    expect(screen.getByRole("link", { name: "Minhas estadias" })).toBeInTheDocument();
    view.unmount();
    renderNav();
    await waitFor(() => expect(seenSnapshots.read).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
  it("shows updates in desktop and drawer, clears when visiting the list", async () => {
    saved.set(key, {});
    const view = renderNav();
    expect(await screen.findByRole("link", { name: "Minhas estadias (há novidades)" })).toBeInTheDocument();
    await view.user.click(screen.getByRole("button", { name: "Abrir a navegação (há novidades)" }));
    expect(
      within(await screen.findByRole("presentation")).getByRole("link", { name: /há novidades/ }),
    ).toBeInTheDocument();
    await view.user.keyboard("{Escape}");
    navigation.pathname = "/owner/bookings";
    view.rerender(<OwnerHeaderNav accountId="a" items={navItemsFor("owner")} />);
    await waitFor(() => expect(saved.get(key)).toEqual(current()));
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
  it("acknowledges only the loaded detail and keeps other unseen stays", async () => {
    saved.set(key, {});
    const second = bookingDto({ id: "0199f0a0-0000-7000-8000-0000000000d2" });
    server.use(
      http.get("*/api/bookings/me", () => HttpResponse.json(apiOk(bookingPageDto([bookingDto(), second])))),
      http.get(`*/api/bookings/${bookingDto().id}`, () => HttpResponse.json(apiOk(bookingDto()))),
    );
    navigation.pathname = `/owner/bookings/${bookingDto().id}`;
    renderNav();
    await waitFor(() => expect(saved.get(key)).toEqual(current()));
    expect(await screen.findByRole("link", { name: /há novidades/ })).toBeInTheDocument();
    expect(saved.get(key)).not.toHaveProperty(second.id);
  });
  it("visiting the sole updated detail clears its update", async () => {
    saved.set(key, {});
    server.use(http.get(`*/api/bookings/${bookingDto().id}`, () => HttpResponse.json(apiOk(bookingDto()))));
    navigation.pathname = `/owner/bookings/${bookingDto().id}`;
    renderNav();
    await waitFor(() => expect(saved.get(key)).toEqual(current()));
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
  it("loads later pages before comparing and does not discard their updates", async () => {
    saved.set(key, current());
    const second = bookingDto({ id: "0199f0a0-0000-7000-8000-0000000000d2" });
    server.use(
      http.get("*/api/bookings/me", ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get("page"));
        return HttpResponse.json(
          apiOk({ ...bookingPageDto(page === 1 ? [bookingDto()] : [second]), page, totalPages: 2, totalCount: 2 }),
        );
      }),
    );
    renderNav();
    expect(await screen.findByRole("link", { name: /há novidades/ })).toBeInTheDocument();
    expect(saved.get(key)).toEqual(current());
  });
  it("does not resurrect an acknowledged detail from stale list data on leaving the page", async () => {
    saved.set(key, current());
    const accepted = bookingDto({ status: "accepted" });
    server.use(http.get(`*/api/bookings/${bookingDto().id}`, () => HttpResponse.json(apiOk(accepted))));
    navigation.pathname = `/owner/bookings/${bookingDto().id}`;
    const view = renderNav();
    await waitFor(() => expect(saved.get(key)?.[bookingDto().id]).toContain("accepted"));
    navigation.pathname = "/pets";
    view.rerender(<OwnerHeaderNav accountId="a" items={navItemsFor("owner")} />);
    await waitFor(() => expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument());
    expect(saved.get(key)?.[bookingDto().id]).toContain("accepted");
  });
  it("failed detail writes suppress the indicator and preserve the previous snapshot", async () => {
    saved.set(key, {});
    vi.mocked(seenSnapshots.write).mockResolvedValue(undefined);
    server.use(http.get(`*/api/bookings/${bookingDto().id}`, () => HttpResponse.json(apiOk(bookingDto()))));
    navigation.pathname = `/owner/bookings/${bookingDto().id}`;
    renderNav();
    await waitFor(() => expect(seenSnapshots.write).toHaveBeenCalled());
    expect(saved.get(key)).toEqual({});
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
  it.each(["requested", "accepted"])(
    "does not downgrade a newer list or the %s snapshot with an older cached detail",
    async (seenStatus) => {
      const previous = { [bookingDto().id]: current()[bookingDto().id]!.replace('"requested"', `"${seenStatus}"`) };
      saved.set(key, previous);
      const client = createTestQueryClient();
      const booking: Booking = { ...bookingDto(), status: "requested", nightlyRateCents: 6000, totalCents: 30000 };
      const detailKey = bookingQueries.detail("a", booking.id).queryKey;
      client.setQueryDefaults(detailKey, { staleTime: Infinity });
      client.setQueryData(detailKey, booking, { updatedAt: Date.now() - 1000 });
      server.use(
        http.get("*/api/bookings/me", () =>
          HttpResponse.json(apiOk(bookingPageDto([bookingDto({ status: "accepted" })]))),
        ),
      );
      navigation.pathname = `/owner/bookings/${booking.id}`;
      renderWithProviders(<OwnerHeaderNav accountId="a" items={navItemsFor("owner")} />, {
        theme: quintalTheme,
        queryClient: client,
      });
      await waitFor(() =>
        expect(
          client.getQueryData(bookingQueries.infinite("a", BOOKING_STATUSES).queryKey)?.pages[0]?.items[0]?.status,
        ).toBe("accepted"),
      );
      await waitFor(() => expect(seenSnapshots.read).toHaveBeenCalled());
      if (seenStatus === "requested")
        expect(await screen.findByRole("link", { name: /há novidades/ })).toBeInTheDocument();
      else expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
      expect(saved.get(key)).toEqual(previous);
    },
  );
  it("rechecks stale queries on focus without polling", async () => {
    saved.set(key, current());
    const view = renderNav();
    await waitFor(() => expect(seenSnapshots.read).toHaveBeenCalled());
    server.use(
      http.get("*/api/bookings/me", () =>
        HttpResponse.json(apiOk(bookingPageDto([bookingDto({ status: "accepted" })]))),
      ),
    );
    await act(async () => {
      focusManager.setFocused(false);
      focusManager.setFocused(true);
    });
    expect(await screen.findByRole("link", { name: /há novidades/ })).toBeInTheDocument();
    expect(
      view.queryClient
        .getQueryCache()
        .getAll()
        .some((query) => query.state.status === "success"),
    ).toBe(true);
  });
  it("keeps accounts separate on switching", async () => {
    saved.set(key, {});
    const view = renderNav();
    await screen.findByRole("link", { name: /há novidades/ });
    view.rerender(<OwnerHeaderNav key="b" accountId="b" items={navItemsFor("owner")} />);
    await waitFor(() => expect(saved.get("owner-stays:b")).toEqual(current()));
    expect(saved.get(key)).toEqual({});
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
  it("suppresses storage and HTTP failures without acknowledging anything", async () => {
    vi.mocked(seenSnapshots.read).mockResolvedValue(undefined);
    const view = renderNav();
    await waitFor(() => expect(seenSnapshots.read).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
    view.unmount();
    server.use(http.get("*/api/bookings/me", () => HttpResponse.json({}, { status: 500 })));
    const failure = renderNav();
    await waitFor(() => expect(failure.queryClient.getQueryCache().getAll()[0]?.state.status).toBe("error"));
    expect(saved.size).toBe(0);
    expect(screen.queryByRole("link", { name: /há novidades/ })).not.toBeInTheDocument();
  });
});
