"use client";

import { Avatar, Box, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useId, useState, type ReactNode } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { initialsOf } from "@/shared/lib/text/initials";
import { StatusTimeline } from "@/shared/ui/data-display/StatusTimeline";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { hostBookingsPath } from "../../lib/bookingPaths";
import { statusLabel, trailSteps } from "../../lib/bookingStatus";
import { describeBookingPet } from "../../lib/describeBookingPet";
import { formatDeadline, formatPeriod, isDeadlineNear } from "../../lib/formatStay";
import type { Booking } from "../../types";
import { AcceptDialog, CancelBookingDialog, DeclineDialog } from "./BookingDecisions";
import { StayMilestones } from "./StayMilestones";

const copy = bookingCopy.detail;

/** O contato do tutor, liberado depois da confirmação (REQ-HREQ-004 e 007). */
function OwnerContact({ booking }: { booking: Booking }) {
  const headingId = useId();
  if (!booking.contact) return null;
  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ p: 2, border: "2px solid", borderRadius: 3, bgcolor: "background.paper" }}
    >
      <Typography id={headingId} sx={{ fontWeight: 800 }}>
        {copy.contact}
      </Typography>
      <Typography>{booking.contact.phone ? copy.phone(booking.contact.phone) : copy.noPhone}</Typography>
    </Box>
  );
}

export interface HostBookingDetailProps {
  accountId: string;
  bookingId: string;
  /** A ficha dos pets (widget `booking-pet-profiles`), composta pela página. */
  petProfiles?: ReactNode;
  /** "Agora" para o prazo; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * O pedido do anfitrião (spec 053, REQ-HREQ-002 a 008): tutor, período, pets, total, prazo e a trilha; a ficha dos pets
 * (composta pela página); e, conforme a situação, "Aceitar" e "Não posso receber" (pedido), o contato e "Cancelar
 * estadia" (confirmada), os marcos "chegou" e "voltou pra casa" (054), ou o que houve (recusada, expirada, cancelada). Toda decisão grava a resposta e atualiza as abas.
 *
 * @example <HostBookingDetail accountId={user.id} bookingId={id} petProfiles={<BookingPetProfiles … />} />
 */
export function HostBookingDetail({ accountId, bookingId, petProfiles, now }: HostBookingDetailProps) {
  const [moment] = useState(() => now ?? new Date());
  const [justConfirmed, setJustConfirmed] = useState(false);
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
  const owner = booking.owner?.name ?? "";
  const steps = trailSteps(booking.status);
  const closed = copy.closed[booking.status];

  return (
    <Stack spacing={4}>
      <Link component={NextLink} href={hostBookingsPath("pedidos")} sx={{ alignSelf: "flex-start" }}>
        {copy.back}
      </Link>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }} useFlexGap>
        <Avatar src={booking.owner?.avatarUrl ?? undefined} alt="" sx={{ width: 56, height: 56 }}>
          {initialsOf(owner)}
        </Avatar>
        <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 36 } }}>
          {copy.heading(owner)}
        </Typography>
        <StatusPill label={statusLabel[booking.status]} />
      </Stack>
      {justConfirmed && booking.status === "confirmed" && <Notice tone="ok" title={bookingCopy.accept.done} />}
      <Stack spacing={0.5}>
        <Typography>{`${formatPeriod(booking.checkIn, booking.checkOut)} · ${bookingCopy.host.nights(booking.nights)}`}</Typography>
        <Typography>{booking.pets.map(describeBookingPet).join(" · ")}</Typography>
        <Typography sx={{ fontWeight: 700 }}>
          {bookingCopy.host.total(formatBRL(fromCents(booking.totalCents)))}
        </Typography>
        <Typography color="text.secondary">{copy.perNight(formatBRL(fromCents(booking.nightlyRateCents)))}</Typography>
        {booking.status === "requested" && booking.responseDeadline && (
          <Typography sx={{ fontWeight: isDeadlineNear(booking.responseDeadline, moment) ? 800 : 400 }}>
            {bookingCopy.host.deadline(formatDeadline(booking.responseDeadline, moment))}
          </Typography>
        )}
      </Stack>
      {steps && <StatusTimeline label={copy.trail} steps={steps} />}
      {closed && <Notice tone="info" title={closed} />}
      {booking.status !== "in_progress" && <OwnerContact booking={booking} />}
      {(booking.status === "confirmed" || booking.status === "in_progress") && (
        <StayMilestones accountId={accountId} booking={booking} now={moment} />
      )}
      {booking.status === "requested" && (
        <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }} useFlexGap>
          <AcceptDialog accountId={accountId} booking={booking} onAccepted={() => setJustConfirmed(true)} />
          <DeclineDialog accountId={accountId} booking={booking} />
        </Stack>
      )}
      {(booking.status === "accepted" || booking.status === "confirmed") && (
        <CancelBookingDialog accountId={accountId} booking={booking} />
      )}
      {petProfiles}
    </Stack>
  );
}
