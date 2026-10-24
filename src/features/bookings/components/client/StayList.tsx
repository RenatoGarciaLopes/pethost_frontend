"use client";

import { keyboardFocus } from "@/shared/theme/focus";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { useInfiniteQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { Surface } from "@/shared/ui/layout/Surface";
import { BOOKING_STATUSES } from "../../api/contracts";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { ownerBookingPaymentPath, ownerBookingPath, SEARCH_PATH } from "../../lib/bookingPaths";
import { ownerStayView, sortOwnerStays } from "../../lib/ownerStayCard";
import type { Booking } from "../../types";
import { StayPhotoFrame } from "./StayPhotoFrame";

const copy = bookingCopy.owner;

/**
 * Uma estadia na lista: o título é o link para o detalhe e se estende pelo card inteiro (REQ-STAYS-002); a ação
 * ("Pagar", "Buscar outro cantinho") é um link à parte, acima dele.
 */
function StayListItem({ booking }: { booking: Booking }) {
  const view = ownerStayView(booking);
  return (
    <Box component="li" sx={{ listStyle: "none" }}>
      <Surface
        elevation="sm"
        interactive
        sx={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: { xs: "auto minmax(0, 1fr)", md: "auto minmax(0, 1fr) auto" },
          alignItems: "center",
          gap: { xs: 1.5, md: 2.5 },
          p: 2,
        }}
      >
        <StayPhotoFrame />
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <StatusPill label={view.statusLabel} tone={view.tone} size="sm" />
          <Typography component="h2" variant="h4" sx={{ fontSize: { xs: "1.1rem", md: "1.3rem" }, lineHeight: 1.2 }}>
            <Link
              component={NextLink}
              href={ownerBookingPath(booking.id)}
              color="text.primary"
              underline="none"
              sx={{
                "&::after": { content: '""', position: "absolute", inset: 0, borderRadius: `${quintalRadii.card}px` },
                [keyboardFocus("&:focus-visible::after")]: { outline: "3px solid", outlineOffset: 3 },
              }}
            >
              {view.title}
            </Link>
          </Typography>
          <Typography variant="body2">{view.summary}</Typography>
          {view.context && (
            <Typography
              variant="body2"
              sx={(theme) => ({
                width: "fit-content",
                color: view.context?.kind === "note" ? "text.secondary" : "text.primary",
                fontWeight: view.context?.kind === "deadline" ? 700 : 400,
                ...(view.context?.kind === "deadline" && {
                  bgcolor: theme.palette.quintal.luz,
                  px: 1,
                  borderRadius: `${quintalRadii.pill}px`,
                }),
              })}
            >
              {view.context.text}
            </Typography>
          )}
        </Stack>
        {view.action === "pay" && (
          <Button
            component={NextLink}
            href={ownerBookingPaymentPath(booking.id)}
            variant="contained"
            sx={{ position: "relative", zIndex: 1, gridColumn: { xs: "1 / -1", md: "auto" } }}
          >
            {copy.card.pay(formatBRL(fromCents(booking.totalCents)))}
          </Button>
        )}
        {view.action === "search" && (
          <Link
            component={NextLink}
            href={SEARCH_PATH}
            color="text.primary"
            sx={{ position: "relative", zIndex: 1, fontWeight: 700, gridColumn: { xs: "1 / -1", md: "auto" } }}
          >
            {copy.card.searchAgain}
          </Link>
        )}
      </Surface>
    </Box>
  );
}

export interface StayListProps {
  accountId: string;
  /** Estadias por página (padrão da API de listas: 20). */
  pageSize?: number;
}

/**
 * "Minhas estadias" do tutor (specs 052 e 094): lista única em ordem de relevância (pagar, acontecendo, confirmadas,
 * esperando, concluídas, as que não aconteceram), cada estadia como card com selo, resumo, linha de contexto e a ação
 * da situação; "Mostrar mais" traz a próxima página. Lista vazia leva à busca.
 *
 * @example <StayList accountId={user.id} />
 */
export function StayList({ accountId, pageSize }: StayListProps) {
  const query = useInfiniteQuery(bookingQueries.infinite(accountId, BOOKING_STATUSES, pageSize));
  const stays = sortOwnerStays(query.data?.pages.flatMap((page) => page.items) ?? []);

  if (query.isPending)
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <SniffLoader label={bookingCopy.loading} />
      </Box>
    );
  if (query.isError)
    return (
      <ErrorState
        title={bookingCopy.loadError}
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );
  if (stays.length === 0)
    return (
      <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
        <Typography>{copy.empty}</Typography>
        <Button component={NextLink} href={SEARCH_PATH} variant="contained">
          {copy.search}
        </Button>
      </Stack>
    );
  return (
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
  );
}
