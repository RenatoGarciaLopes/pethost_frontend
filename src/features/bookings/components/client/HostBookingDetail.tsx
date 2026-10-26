"use client";

import { Box, Divider, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useId, useState, type ReactNode } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { formatBRL, fromCents, splitEarnings } from "@/shared/lib/money";
import { StatusTimeline } from "@/shared/ui/data-display/StatusTimeline";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill, type StatusPillTone } from "@/shared/ui/feedback/StatusPill";
import { PageHeader } from "@/shared/ui/layout/PageHeader";
import { Surface } from "@/shared/ui/layout/Surface";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { hostBookingsPath } from "../../lib/bookingPaths";
import { statusLabel, trailSteps } from "../../lib/bookingStatus";
import { describeBookingPet } from "../../lib/describeBookingPet";
import { formatDeadline, formatPeriod, isDeadlineNear } from "../../lib/formatStay";
import type { Booking, BookingStatus } from "../../types";
import { AcceptDialog, CancelBookingDialog, DeclineDialog } from "./BookingDecisions";
import { StayMilestones } from "./StayMilestones";

const copy = bookingCopy.detail;
const names = new Intl.ListFormat("pt-BR", { type: "conjunction" });

/** Tom do selo: a espera em céu, a estadia de pé em grama, o que acabou neutro. */
const STATUS_TONE: Readonly<Record<BookingStatus, StatusPillTone>> = {
  requested: "info",
  accepted: "ok",
  confirmed: "ok",
  in_progress: "ok",
  completed: "neutro",
  declined: "neutro",
  expired: "neutro",
  cancelled: "neutro",
};

/** O contato do tutor, liberado depois da confirmação (REQ-HREQ-004 e 007). */
function OwnerContact({ booking }: { booking: Booking }) {
  const headingId = useId();
  if (!booking.contact) return null;
  return (
    <Box component="section" aria-labelledby={headingId}>
      <Typography id={headingId} sx={{ fontWeight: 800 }}>
        {copy.contact}
      </Typography>
      <Typography>{booking.contact.phone ? copy.phone(booking.contact.phone) : copy.noPhone}</Typography>
    </Box>
  );
}

/** Uma linha da conta: rótulo à esquerda, valor à direita. */
function BillRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, fontWeight: strong ? 800 : 400 }}>
      <Typography component="span" sx={{ fontWeight: "inherit" }}>
        {label}
      </Typography>
      <Typography component="span" sx={{ fontWeight: "inherit", whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );
}

export interface HostBookingDetailProps {
  /** Ação de conversa composta pela rota, junto da outra pessoa.
   * @example conversation={<BookingConversation accountId={id} bookingId={bookingId} side="host" />} */
  conversation?: ReactNode;
  accountId: string;
  bookingId: string;
  /** A ficha dos pets (widget `booking-pet-profiles`), composta pela página. */
  petProfiles?: ReactNode;
  /** "Agora" para o prazo; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * O pedido do anfitrião (spec 053, REQ-HREQ-002 a 008; composição da spec 005, REQ-UIC-002/009). À esquerda, quem pede e
 * até quando, o pet no título, a trilha e a ficha dos pets (composta pela página). À direita, a caixa "Sua resposta":
 * período, a conta (diária × noites × pets, a taxa da PetHost e o que fica para o anfitrião) e, conforme a situação,
 * "Aceitar o pedido" e "Não posso receber" (pedido), o contato e "Cancelar estadia" (confirmada) ou os marcos "chegou" e
 * "voltou pra casa" (054). No celular a caixa vem depois do conteúdo. Toda decisão grava a resposta e atualiza as abas.
 *
 * @example <HostBookingDetail accountId={user.id} bookingId={id} petProfiles={<BookingPetProfiles … />} />
 */
export function HostBookingDetail({ accountId, bookingId, petProfiles, now, conversation }: HostBookingDetailProps) {
  const [moment] = useState(() => now ?? new Date());
  const [justConfirmed, setJustConfirmed] = useState(false);
  const answerId = useId();
  const query = useQuery(bookingQueries.detail(accountId, bookingId));

  if (query.isPending) return <Skeleton variant="rounded" height={320} aria-label={bookingCopy.loading} />;
  if (query.isError)
    return (
      <ErrorState
        title={bookingCopy.detailLoadError}
        description={translateError(query.error)}
        onRetry={() => void query.refetch()}
      />
    );

  const booking = query.data;
  const owner = booking.owner?.name ?? "";
  const steps = trailSteps(booking.status);
  const closed = copy.closed[booking.status];
  const requested = booking.status === "requested";
  const pets = names.format(booking.pets.map((pet) => pet.name ?? bookingCopy.unknownPet));
  const nights = bookingCopy.host.nights(booking.nights);
  const { feeCents, netCents } = splitEarnings(booking.totalCents);
  const deadline = requested ? booking.responseDeadline : null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 360px" },
        gap: { xs: 3, md: 5 },
        alignItems: "start",
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Link component={NextLink} href={hostBookingsPath("pedidos")} sx={{ alignSelf: "flex-start" }}>
          {copy.back}
        </Link>
        <PageHeader
          eyebrow={
            <>
              <span>{copy.heading(owner)}</span>
              {deadline && (
                <>
                  <span aria-hidden="true">·</span>
                  <Box component="span" sx={{ color: isDeadlineNear(deadline, moment) ? "text.primary" : undefined }}>
                    {bookingCopy.host.deadline(formatDeadline(deadline, moment))}
                  </Box>
                </>
              )}
              <StatusPill label={statusLabel[booking.status]} tone={STATUS_TONE[booking.status]} size="sm" />
            </>
          }
          title={requested ? copy.headline(pets, booking.pets.length > 1, nights) : copy.stayOf(pets)}
        />
        {conversation}
        {justConfirmed && booking.status === "confirmed" && <Notice tone="ok" title={bookingCopy.accept.done} />}
        {closed && <Notice tone="info" title={closed} />}
        {steps && <StatusTimeline label={copy.trail} steps={steps} />}
        {petProfiles}
      </Stack>
      <Surface
        component="aside"
        aria-labelledby={answerId}
        elevation="md"
        sx={{ p: 3, display: "grid", gap: 2, position: { md: "sticky" }, top: { md: 96 } }}
      >
        <Typography id={answerId} component="h2" variant="overline">
          {requested ? bookingCopy.answer.title : bookingCopy.answer.stay}
        </Typography>
        <Stack spacing={0.5}>
          <Typography>{`${formatPeriod(booking.checkIn, booking.checkOut)} · ${nights}`}</Typography>
          <Typography color="text.secondary">{booking.pets.map(describeBookingPet).join(" · ")}</Typography>
        </Stack>
        <Stack spacing={0.75}>
          <BillRow
            label={bookingCopy.answer.line(
              formatBRL(fromCents(booking.nightlyRateCents)),
              booking.nights,
              booking.pets.length,
            )}
            value={formatBRL(fromCents(booking.totalCents))}
          />
          <BillRow label={bookingCopy.answer.fee} value={bookingCopy.answer.minus(formatBRL(fromCents(feeCents)))} />
          <BillRow label={bookingCopy.answer.net} value={formatBRL(fromCents(netCents))} strong />
        </Stack>
        {requested && (
          <>
            <AcceptDialog accountId={accountId} booking={booking} onAccepted={() => setJustConfirmed(true)} />
            <DeclineDialog accountId={accountId} booking={booking} />
            <Typography variant="body2" color="text.secondary">
              {bookingCopy.answer.afterAccept(owner)}
            </Typography>
          </>
        )}
        {booking.contact && booking.status !== "in_progress" && (
          <>
            <Divider />
            <OwnerContact booking={booking} />
          </>
        )}
        {/* Continua montado em `completed`: senão "voltou pra casa" some junto com a mudança de status. */}
        {(booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "completed") && (
          <StayMilestones accountId={accountId} booking={booking} now={moment} />
        )}
        {(booking.status === "accepted" || booking.status === "confirmed") && (
          <CancelBookingDialog accountId={accountId} booking={booking} />
        )}
      </Surface>
    </Box>
  );
}
