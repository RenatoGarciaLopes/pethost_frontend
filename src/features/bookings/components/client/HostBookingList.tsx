"use client";

import { Avatar, Box, Button, Link, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { initialsOf } from "@/shared/lib/text/initials";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { hostBookingPath, hostBookingsPath } from "../../lib/bookingPaths";
import { HOST_TABS, type BookingTab } from "../../lib/bookingStatus";
import { describeBookingPet } from "../../lib/describeBookingPet";
import { formatDeadline, formatPeriod, isDeadlineNear } from "../../lib/formatStay";
import type { Booking } from "../../types";

const copy = bookingCopy.host;
const REQUESTS_TAB = HOST_TABS[0]!;

function BookingCard({ booking, now }: { booking: Booking; now: Date }) {
  const owner = booking.owner?.name ?? "";
  const near = isDeadlineNear(booking.responseDeadline, now);
  return (
    <Stack
      component="article"
      aria-label={`Pedido de ${owner}`}
      spacing={1.5}
      sx={{ p: 2, border: "2px solid", borderRadius: 3, bgcolor: "background.paper" }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
        <Avatar
          src={booking.owner?.avatarUrl ?? undefined}
          alt=""
          sx={{ width: 48, height: 48, bgcolor: "primary.main", color: "primary.contrastText" }}
        >
          {initialsOf(owner)}
        </Avatar>
        <Typography component="h3" sx={{ fontWeight: 800, fontSize: "1.1rem" }}>
          {owner}
        </Typography>
      </Stack>
      <Typography>{booking.pets.map(describeBookingPet).join(" · ")}</Typography>
      <Typography>
        {formatPeriod(booking.checkIn, booking.checkOut)} · {copy.nights(booking.nights)} ·{" "}
        {copy.total(formatBRL(fromCents(booking.totalCents)))}
      </Typography>
      {booking.status === "requested" && booking.responseDeadline && (
        <Box>
          <Typography sx={{ fontWeight: near ? 800 : 400 }}>
            {copy.deadline(formatDeadline(booking.responseDeadline, now))}
          </Typography>
          {near && <Notice tone="atencao" title={copy.deadlineNear} />}
        </Box>
      )}
      <Box>
        <Button
          component={NextLink}
          href={hostBookingPath(booking.id)}
          variant="outlined"
          aria-label={copy.openLabel(owner)}
        >
          {copy.open}
        </Button>
      </Box>
    </Stack>
  );
}

function Tabs({ accountId, current }: { accountId: string; current: BookingTab }) {
  const requests = useQuery(bookingQueries.mine(accountId, { statuses: REQUESTS_TAB.statuses }));
  const waiting = requests.data?.totalCount ?? 0;
  return (
    <Box component="nav" aria-label={copy.tabsLabel}>
      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, display: "flex", gap: 1, flexWrap: "wrap" }}>
        {HOST_TABS.map((tab) => {
          const active = tab.id === current.id;
          return (
            <li key={tab.id}>
              <Link
                component={NextLink}
                href={hostBookingsPath(tab.id)}
                aria-current={active ? "page" : undefined}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                  minHeight: 48,
                  px: 2,
                  borderRadius: 999,
                  border: "2px solid",
                  fontWeight: 700,
                  textDecoration: "none",
                  bgcolor: active ? "text.primary" : "transparent",
                  color: active ? "background.paper" : "text.primary",
                }}
              >
                {tab.label}
                {tab.id === REQUESTS_TAB.id && waiting > 0 && (
                  <Box component="span" sx={{ fontSize: "0.85rem" }}>
                    {copy.tabCount(waiting)}
                  </Box>
                )}
              </Link>
            </li>
          );
        })}
      </Box>
    </Box>
  );
}

export interface HostBookingListProps {
  accountId: string;
  /** Aba atual (da URL). */
  tab: BookingTab;
  /** Página atual (da URL), a partir de 1. */
  page: number;
  /** "Agora" para o prazo; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * "Pedidos e estadias" do anfitrião (REQ-HREQ-001 e 002): abas na URL (Pedidos, com contador; Próximas; Acontecendo;
 * Anteriores) e, em cada pedido, o tutor, os pets, o período, o total e o prazo "Responda até…" em Brasília, com
 * destaque quando faltam menos de 3 horas.
 *
 * @example <HostBookingList accountId={user.id} tab={hostTabOf(aba)} page={1} />
 */
export function HostBookingList({ accountId, tab, page, now }: HostBookingListProps) {
  const [moment] = useState(() => now ?? new Date());
  const query = useQuery(bookingQueries.mine(accountId, { statuses: tab.statuses, page }));

  return (
    <Stack spacing={3}>
      <Tabs accountId={accountId} current={tab} />
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
      ) : query.data.items.length === 0 ? (
        <Typography color="text.secondary">{copy.empty[tab.id]}</Typography>
      ) : (
        <Stack spacing={2}>
          {query.data.items.map((booking) => (
            <BookingCard key={booking.id} booking={booking} now={moment} />
          ))}
          {query.data.totalPages > 1 && (
            <Stack component="nav" aria-label={copy.pageLabel} direction="row" spacing={2}>
              {page > 1 && (
                <Button component={NextLink} href={hostBookingsPath(tab.id, page - 1)}>
                  {copy.previous}
                </Button>
              )}
              {page < query.data.totalPages && (
                <Button component={NextLink} href={hostBookingsPath(tab.id, page + 1)}>
                  {copy.next}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      )}
    </Stack>
  );
}
