"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { ownerBookingPath, ownerBookingsPath, SEARCH_PATH } from "../../lib/bookingPaths";
import { OWNER_TABS, statusLabel, type BookingTab } from "../../lib/bookingStatus";
import { formatPeriod } from "../../lib/formatStay";
import type { Booking } from "../../types";

const copy = bookingCopy.owner;

/** Uma estadia na lista: o item inteiro é o link para o detalhe (REQ-STAYS-002); o nome é o próprio texto visível. */
function StayListItem({ booking }: { booking: Booking }) {
  const period = formatPeriod(booking.checkIn, booking.checkOut);
  const title = booking.listing?.title ?? copy.listingGone;
  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <Link
        component={NextLink}
        href={ownerBookingPath(booking.id)}
        sx={{
          display: "grid",
          gap: 0.5,
          p: 2,
          border: "2px solid",
          borderRadius: `${quintalRadii.card}px`,
          bgcolor: "background.paper",
          color: "text.primary",
          textDecoration: "none",
        }}
      >
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
          <Typography component="span" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
            {title}
          </Typography>
          <StatusPill label={statusLabel[booking.status]} size="sm" />
        </Stack>
        {booking.listing && (
          <Typography component="span" color="text.secondary">
            {`${booking.listing.neighborhood}, ${booking.listing.city}`}
          </Typography>
        )}
        <Typography component="span">
          {`${period} · ${booking.pets.map((pet) => pet.name ?? bookingCopy.unknownPet).join(", ")}`}
        </Typography>
        <Typography component="span" sx={{ fontWeight: 700 }}>
          {bookingCopy.host.total(formatBRL(fromCents(booking.totalCents)))}
        </Typography>
      </Link>
    </Box>
  );
}

function Tabs({ current }: { current: BookingTab }) {
  return (
    <Box component="nav" aria-label={copy.tabsLabel}>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {OWNER_TABS.map((tab) => {
          const active = tab.id === current.id;
          return (
            <li key={tab.id}>
              <Link
                component={NextLink}
                href={ownerBookingsPath(tab.id)}
                aria-current={active ? "page" : undefined}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  minHeight: 48,
                  px: 2,
                  borderRadius: `${quintalRadii.pill}px`,
                  border: "2px solid",
                  fontWeight: 700,
                  textDecoration: "none",
                  bgcolor: active ? "text.primary" : "transparent",
                  color: active ? "background.paper" : "text.primary",
                }}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}

export interface StayListProps {
  accountId: string;
  /** Aba atual (da URL). */
  tab: BookingTab;
  /** Estadias por página (padrão da API de listas: 20). */
  pageSize?: number;
}

/**
 * "Minhas estadias" do tutor (spec 052, REQ-STAYS-001 a 003): abas na URL (Próximas, Acontecendo, Anteriores), cada
 * estadia como link com o cantinho, o período, os pets, o total e a situação em texto, e "Mostrar mais" por aba. Aba
 * vazia tem frase própria; em "Próximas", o caminho da busca.
 *
 * @example <StayList accountId={user.id} tab={ownerTabOf(aba)} />
 */
export function StayList({ accountId, tab, pageSize }: StayListProps) {
  const query = useInfiniteQuery(bookingQueries.infinite(accountId, tab.statuses, pageSize));
  const stays = query.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <Stack spacing={3}>
      <Tabs current={tab} />
      {query.isPending ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <SniffLoader label={bookingCopy.loading} />
        </Box>
      ) : query.isError ? (
        <ErrorState
          title={bookingCopy.loadError}
          description={getErrorMessage(query.error)}
          onRetry={() => void query.refetch()}
        />
      ) : stays.length === 0 ? (
        <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
          <Typography>{copy.empty[tab.id]}</Typography>
          {tab.id === OWNER_TABS[0]!.id && (
            <Button component={NextLink} href={SEARCH_PATH} variant="contained">
              {copy.search}
            </Button>
          )}
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Box component="ul" aria-label={copy.listLabel} sx={{ m: 0, p: 0, display: "grid", gap: 2 }}>
            {stays.map((booking) => (
              <StayListItem key={booking.id} booking={booking} />
            ))}
          </Box>
          {query.hasNextPage && (
            <Box>
              <Button
                variant="outlined"
                disabled={query.isFetchingNextPage}
                aria-busy={query.isFetchingNextPage || undefined}
                onClick={() => void query.fetchNextPage()}
              >
                {copy.more}
              </Button>
            </Box>
          )}
        </Stack>
      )}
    </Stack>
  );
}
