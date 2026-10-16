"use client";

import { Box, Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useId, useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { maskCep, maskPhone } from "@/shared/lib/masks";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { StatusTimeline } from "@/shared/ui/data-display/StatusTimeline";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { ownerBookingsPath, SEARCH_PATH } from "../../lib/bookingPaths";
import { statusLabel, trailSteps } from "../../lib/bookingStatus";
import { formatDeadline, formatPeriod } from "../../lib/formatStay";
import type { Booking, BookingStatus } from "../../types";
import { CancelStayDialog } from "./CancelStayDialog";

const copy = bookingCopy.stay;
/** Só nestes status o contato do anfitrião aparece (REQ-STAYS-005). */
const CONTACT_STATUSES: readonly BookingStatus[] = ["confirmed", "in_progress", "completed"];
const CANCELLABLE: readonly BookingStatus[] = ["requested", "confirmed"];

/**
 * O contato do anfitrião depois da confirmação (REQ-STAYS-005): telefone formatado com `tel:` e o endereço exato.
 * @example <ContactCard booking={booking} />
 */
function ContactCard({ booking }: { booking: Booking }) {
  const headingId = useId();
  const contact = booking.contact;
  if (!contact || !CONTACT_STATUSES.includes(booking.status)) return null;
  const { address } = contact;
  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ p: 2, border: "2px solid", borderRadius: 3, bgcolor: "background.paper" }}
    >
      <Typography id={headingId} variant="h2" sx={{ fontSize: 20, mb: 1 }}>
        {copy.contact}
      </Typography>
      {contact.phone ? (
        <Typography>
          {`${copy.phone}: `}
          <Link href={`tel:${contact.phone}`}>{maskPhone(contact.phone)}</Link>
        </Typography>
      ) : (
        <Typography>{copy.noPhone}</Typography>
      )}
      {address && (
        <Typography>
          {`${copy.address}: ${[address.street, address.number, address.complement].filter(Boolean).join(", ")}`}
          <br />
          {`${address.neighborhood}, ${address.city} - ${address.state}, ${maskCep(address.zipCode)}`}
        </Typography>
      )}
    </Box>
  );
}

export interface StayDetailProps {
  accountId: string;
  bookingId: string;
  /** "Agora" para o prazo; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * A estadia do tutor (spec 052, REQ-STAYS-004 a 009): a trilha Pedido → Confirmada → Chegou → Voltou pra casa, o resumo
 * com a conta do total e, enquanto espera, até quando o anfitrião responde. Contato só depois da confirmação; recusada
 * ou expirada explicam e levam à busca; "Cancelar estadia" em pedido e confirmada.
 *
 * @example <StayDetail accountId={user.id} bookingId={id} />
 */
export function StayDetail({ accountId, bookingId, now }: StayDetailProps) {
  const [moment] = useState(() => now ?? new Date());
  const [conflict, setConflict] = useState<string | null>(null);
  const query = useQuery(bookingQueries.detail(accountId, bookingId));

  if (query.isPending) return <Skeleton variant="rounded" height={320} aria-label={bookingCopy.loading} />;
  if (query.isError)
    return (
      <ErrorState
        title={bookingCopy.detailLoadError}
        description={getErrorMessage(query.error)}
        onRetry={() => void query.refetch()}
      />
    );

  const booking = query.data;
  const host = booking.host?.name ?? copy.theHost;
  const steps = trailSteps(booking.status);
  const nightly = formatBRL(fromCents(booking.nightlyRateCents));
  const total = formatBRL(fromCents(booking.totalCents));

  return (
    <Stack spacing={3}>
      <Link component={NextLink} href={ownerBookingsPath("proximas")} sx={{ alignSelf: "flex-start" }}>
        {copy.back}
      </Link>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 36 } }}>
          {booking.listing?.title ?? bookingCopy.owner.listingGone}
        </Typography>
        <StatusPill label={statusLabel[booking.status]} />
      </Stack>
      {booking.status === "cancelled" && (
        <Notice
          tone="ok"
          title={copy.cancelled}
          action={booking.refundPercentage !== null ? <span>{copy.refund(booking.refundPercentage)}</span> : undefined}
        />
      )}
      {conflict && <Notice tone="atencao" title={conflict} />}
      {steps && <StatusTimeline label={copy.trail} steps={steps} />}
      {booking.status === "requested" && booking.responseDeadline && (
        <Typography sx={{ fontWeight: 700 }}>
          {copy.deadline(host, formatDeadline(booking.responseDeadline, moment))}
        </Typography>
      )}
      <Box
        component="dl"
        aria-label={copy.summary}
        sx={{
          m: 0,
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: 3,
          rowGap: 1,
          "& dd": { m: 0 },
        }}
      >
        <dt>{copy.period}</dt>
        <dd>{formatPeriod(booking.checkIn, booking.checkOut)}</dd>
        <dt>{copy.pets}</dt>
        <dd>{booking.pets.map((pet) => pet.name ?? bookingCopy.unknownPet).join(", ")}</dd>
        {booking.listing && (
          <>
            <dt>{copy.listing}</dt>
            <dd>{`${booking.listing.neighborhood}, ${booking.listing.city}`}</dd>
          </>
        )}
        <dt>{bookingCopy.detail.total}</dt>
        <dd>{copy.bill(nightly, booking.nights, booking.petCount, total)}</dd>
      </Box>
      <ContactCard booking={booking} />
      {booking.status === "declined" && (
        <Stack spacing={1}>
          <Typography>{copy.declined(host)}</Typography>
          {booking.declineReason && (
            <Typography color="text.secondary">{copy.declinedReason(booking.declineReason)}</Typography>
          )}
        </Stack>
      )}
      {booking.status === "expired" && <Typography>{copy.expired(host)}</Typography>}
      {(booking.status === "declined" || booking.status === "expired") && (
        <Box>
          <Button component={NextLink} href={SEARCH_PATH} variant="contained">
            {copy.searchAgain}
          </Button>
        </Box>
      )}
      {CANCELLABLE.includes(booking.status) && (
        <CancelStayDialog accountId={accountId} booking={booking} onConflict={setConflict} />
      )}
    </Stack>
  );
}
