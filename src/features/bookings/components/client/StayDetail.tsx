"use client";

import { quintalRadii } from "@/shared/theme/tokens/radii";
import { Box, Button, Link, Skeleton, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import NextLink from "next/link";
import { useId, useState } from "react";
import { getErrorMessage } from "@/shared/api/errors/getErrorMessage";
import { maskCep, maskPhone } from "@/shared/lib/masks";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { bookingQueries } from "../../api/queries";
import { bookingCopy } from "../../lib/bookingCopy";
import { OWNER_BOOKINGS_PATH, ownerBookingPaymentPath, SEARCH_PATH } from "../../lib/bookingPaths";
import { ownerStayView } from "../../lib/ownerStayCard";
import { stayNow, stayTrail, type StayNow } from "../../lib/stayDetailView";
import type { Booking, BookingStatus } from "../../types";
import { CancelStayDialog } from "./CancelStayDialog";
import { StayPhotoFrame } from "./StayPhotoFrame";
import { StaySummary } from "./StaySummary";
import { StayTimeline } from "./StayTimeline";

const copy = bookingCopy.stay;
/** Só nestes status o contato do anfitrião aparece (REQ-STAYS-005). */
const CONTACT_STATUSES: readonly BookingStatus[] = ["confirmed", "in_progress", "completed"];
const CANCELLABLE: readonly BookingStatus[] = ["requested", "confirmed"];

/**
 * O contato do anfitrião depois da confirmação (REQ-STAYS-005): telefone formatado com `tel:` e o endereço exato.
 * @example <ContactCard booking={booking} />
 */
/** O contato só aparece depois da confirmação e se a API o mandou. */
const showsContact = (booking: Booking) => Boolean(booking.contact) && CONTACT_STATUSES.includes(booking.status);

function ContactCard({ booking }: { booking: Booking }) {
  const headingId = useId();
  const contact = booking.contact;
  if (!contact || !showsContact(booking)) return null;
  const { address } = contact;
  return (
    <Box
      component="section"
      aria-labelledby={headingId}
      sx={{ p: 2, border: "2px solid", borderRadius: `${quintalRadii.card}px`, bgcolor: "background.paper" }}
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

/** "O que acontece agora" (spec 097): a frase da etapa, o apoio e a ação que existe (pagar ou procurar outro cantinho). */
function NowPanel({ now, booking }: { now: StayNow; booking: Booking }) {
  const action =
    now.action === "pay" ? (
      <Button component={NextLink} href={ownerBookingPaymentPath(booking.id)} variant="contained">
        {copy.now.pay(formatBRL(fromCents(booking.totalCents)))}
      </Button>
    ) : now.action === "search" ? (
      <Button component={NextLink} href={SEARCH_PATH} variant="contained">
        {copy.searchAgain}
      </Button>
    ) : undefined;
  return (
    <Stack spacing={1}>
      <Typography component="h2" variant="overline" color="text.secondary">
        {now.heading}
      </Typography>
      <Notice tone={now.tone} title={now.title} action={action}>
        {now.details.map((line) => (
          <Typography key={line} component="p">
            {line}
          </Typography>
        ))}
      </Notice>
    </Stack>
  );
}

export interface StayDetailProps {
  accountId: string;
  bookingId: string;
  /** "Agora" para o prazo; padrão: o momento da montagem. */
  now?: Date;
}

/**
 * A estadia do tutor (specs 052 e 097): cabeçalho com a casa e o selo, a linha do tempo com os momentos, "o que acontece
 * agora" com a ação da etapa, o resumo na lateral (abaixo no celular), o contato só depois da confirmação e "Cancelar
 * estadia" em pedido e confirmada. Recusada, expirada e cancelada trocam a trilha pelo aviso do que houve.
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
  const view = ownerStayView(booking, moment);
  const trail = stayTrail(booking);
  const cancellable = CANCELLABLE.includes(booking.status);
  const contact = showsContact(booking);
  const left = [trail && "trail", "now", contact && "contact", cancellable && "actions"].filter(Boolean) as string[];
  const mobileAreas = [trail && "trail", "now", "summary", contact && "contact", cancellable && "actions"].filter(
    Boolean,
  );

  return (
    <Stack spacing={3}>
      <Link component={NextLink} href={OWNER_BOOKINGS_PATH} sx={{ alignSelf: "flex-start" }}>
        {copy.back}
      </Link>
      <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
        <StayPhotoFrame size="header" />
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <StatusPill label={view.statusLabel} tone={view.tone} />
          <Typography variant="h1" sx={{ fontSize: { xs: 26, md: 36 }, lineHeight: 1.15 }}>
            {view.title}
          </Typography>
          {booking.listing && (
            <Typography color="text.secondary">
              {`${booking.listing.title} · ${booking.listing.neighborhood}, ${booking.listing.city}`}
            </Typography>
          )}
        </Stack>
      </Stack>
      {conflict && <Notice tone="atencao" title={conflict} />}
      <Box
        sx={{
          display: "grid",
          gap: 3,
          alignItems: "start",
          gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "minmax(0, 1fr) 340px" },
          gridTemplateAreas: {
            xs: mobileAreas.map((area) => `"${area}"`).join(" "),
            md: left.map((area) => `"${area} summary"`).join(" "),
          },
          gridTemplateRows: { md: `${"auto ".repeat(left.length - 1)}1fr` },
        }}
      >
        {trail && (
          <Box sx={{ gridArea: "trail" }}>
            <StayTimeline label={copy.trail} steps={trail} />
          </Box>
        )}
        <Box sx={{ gridArea: "now" }}>
          <NowPanel now={stayNow(booking, moment)} booking={booking} />
        </Box>
        <Box sx={{ gridArea: "summary" }}>
          <StaySummary booking={booking} />
        </Box>
        {contact && (
          <Box sx={{ gridArea: "contact" }}>
            <ContactCard booking={booking} />
          </Box>
        )}
        {cancellable && (
          <Box sx={{ gridArea: "actions" }}>
            <CancelStayDialog accountId={accountId} booking={booking} onConflict={setConflict} />
          </Box>
        )}
      </Box>
    </Stack>
  );
}
