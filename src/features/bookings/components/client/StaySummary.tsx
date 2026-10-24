import { Box, Stack, Typography } from "@mui/material";
import { useId } from "react";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { Surface } from "@/shared/ui/layout/Surface";
import { bookingCopy } from "../../lib/bookingCopy";
import { formatStayDay } from "../../lib/formatStay";
import type { Booking } from "../../types";

const copy = bookingCopy.stay;

/**
 * O resumo da estadia na lateral (spec 097): chegada e saída com o dia da semana, noites, pets, cantinho e a conta com o
 * total em destaque. Só dados da reserva.
 *
 * @example <StaySummary booking={booking} />
 */
export function StaySummary({ booking }: { booking: Booking }) {
  const headingId = useId();
  const nightly = formatBRL(fromCents(booking.nightlyRateCents));
  return (
    <Surface component="section" aria-labelledby={headingId} elevation="sm" sx={{ p: 2.5 }}>
      <Typography id={headingId} component="h2" variant="h4" sx={{ fontSize: 22, mb: 2 }}>
        {copy.summary}
      </Typography>
      <Box
        component="dl"
        sx={{
          m: 0,
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          columnGap: 2,
          rowGap: 1.25,
          "& dd": { m: 0 },
          "& dt": { color: "text.secondary" },
        }}
      >
        <dt>{copy.arrival}</dt>
        <dd>{formatStayDay(booking.checkIn)}</dd>
        <dt>{copy.departure}</dt>
        <dd>{formatStayDay(booking.checkOut)}</dd>
        <dt>{copy.nights}</dt>
        <dd>{booking.nights}</dd>
        <dt>{copy.pets}</dt>
        <dd>
          <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
            {booking.pets.map((pet) => (
              <StatusPill key={pet.id} label={pet.name ?? bookingCopy.unknownPet} size="sm" />
            ))}
          </Stack>
        </dd>
        {booking.listing && (
          <>
            <dt>{copy.listing}</dt>
            <dd>
              {booking.listing.title}
              <Typography component="span" color="text.secondary" sx={{ display: "block" }}>
                {`${booking.listing.neighborhood}, ${booking.listing.city}`}
              </Typography>
            </dd>
          </>
        )}
      </Box>
      <Box sx={{ mt: 2, pt: 2, borderTop: "2px dashed", borderColor: "divider" }}>
        <Typography color="text.secondary">
          {bookingCopy.answer.line(nightly, booking.nights, booking.petCount)}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.5 }}>
          <Typography sx={{ fontWeight: 700 }}>{bookingCopy.detail.total}</Typography>
          <Typography variant="h4" component="p" sx={{ fontSize: 26 }}>
            {formatBRL(fromCents(booking.totalCents))}
          </Typography>
        </Box>
      </Box>
    </Surface>
  );
}
