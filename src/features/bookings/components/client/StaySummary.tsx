import { Box, Stack, Typography } from "@mui/material";
import { useId, type ReactNode } from "react";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { Surface } from "@/shared/ui/layout/Surface";
import { paymentCopy } from "../../lib/paymentCopy";
import { bookingCopy } from "../../lib/bookingCopy";
import { formatStayDay } from "../../lib/formatStay";
import type { Booking } from "../../types";

const copy = bookingCopy.stay;

/**
 * O resumo da estadia na lateral (spec 097): chegada e saída com o dia da semana, noites, pets, cantinho e a conta com o
 * total em destaque. Checkout aceita capa e valores autoritativos do pagamento em reais;
 * sem checkout, usa apenas a reserva. Sem efeitos de rede; o caller trata falhas da foto.
 *
 * @example <StaySummary booking={booking} />
 */
export function StaySummary({
  booking,
  checkout,
  cover,
}: {
  booking: Booking;
  /** Checkout amounts in reais from payment API; omitted keeps the stay detail unchanged. */
  checkout?: { totalAmount: number; paidAmount: number };
  /** Optional checkout photo or fallback, owned by the caller. */
  cover?: ReactNode;
}) {
  const headingId = useId();
  const nightly = formatBRL(fromCents(booking.nightlyRateCents));
  return (
    <Surface
      component="section"
      aria-labelledby={headingId}
      elevation="sm"
      sx={{
        overflow: "hidden",
        ...(checkout && {
          display: { xs: "grid", md: "block" },
          gridTemplateColumns: cover ? "72px minmax(0, 1fr)" : "1fr",
          gap: 1.5,
          p: { xs: 1.5, md: 0 },
        }),
      }}
    >
      {cover && (
        <Box
          sx={
            checkout
              ? { gridColumn: 1, gridRow: 1, borderRadius: { xs: "12px", md: 0 }, overflow: "hidden" }
              : undefined
          }
        >
          {cover}
        </Box>
      )}
      <Box sx={{ display: { xs: checkout ? "contents" : "block", md: "block" }, p: { xs: 2.5, md: 2.5 } }}>
        <Typography
          id={headingId}
          component="h2"
          variant="h4"
          sx={{ fontSize: 22, mb: 2, display: { xs: checkout ? "none" : "block", md: "block" } }}
        >
          {copy.summary}
        </Typography>
        {checkout ? (
          <Stack spacing={{ xs: 0, md: 1.5 }} sx={{ display: { xs: "contents", md: "flex" } }}>
            <Box
              sx={{ gridColumn: cover ? 2 : 1, gridRow: 1, alignSelf: { xs: "center", md: "stretch" }, minWidth: 0 }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 700 }}>{booking.listing?.title ?? paymentCopy.yourPlace}</Typography>
                {booking.host && <Typography variant="body2">{booking.host.name}</Typography>}
                {booking.listing && (
                  <Typography variant="body2" color="text.secondary">
                    {booking.listing.neighborhood}
                  </Typography>
                )}
              </Box>
            </Box>
            <Box
              component="dl"
              sx={{
                m: 0,
                gridColumn: "1 / -1",
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                border: "2px solid",
                borderRadius: "16px",
                "& > div": { p: { xs: 1, md: 1.5 } },
                "& > div + div": { borderLeft: "2px dashed", borderColor: "divider" },
                "& dt": { textTransform: "uppercase", fontSize: 12 },
                "& dd": { m: 0, fontWeight: 700, fontSize: 14 },
              }}
            >
              <div>
                <dt>{copy.arrival}</dt>
                <dd>{formatStayDay(booking.checkIn)}</dd>
              </div>
              <div>
                <dt>{copy.departure}</dt>
                <dd>{formatStayDay(booking.checkOut)}</dd>
              </div>
            </Box>
            <Box sx={{ gridColumn: "1 / -1" }}>
              <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
                {copy.pets}
              </Typography>
              <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap" }}>
                {booking.pets.map((pet) => (
                  <StatusPill key={pet.id} label={pet.name ?? bookingCopy.unknownPet} size="sm" />
                ))}
              </Stack>
            </Box>
          </Stack>
        ) : (
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
        )}
        <Box
          sx={{
            gridColumn: "1 / -1",
            mt: { xs: checkout ? 1.5 : 2, md: 2 },
            pt: { xs: checkout ? 1 : 2, md: 2 },
            borderTop: "2px dashed",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {bookingCopy.answer.line(nightly, booking.nights, booking.petCount)}
            </Typography>
            {checkout && (
              <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                {formatBRL(checkout.totalAmount)}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{bookingCopy.detail.total}</Typography>
            <Typography variant="h4" component="p" sx={{ fontSize: 26 }}>
              {formatBRL(checkout?.totalAmount ?? fromCents(booking.totalCents))}
            </Typography>
          </Box>
        </Box>
        {!!checkout?.paidAmount && (
          <Typography variant="body2" sx={{ mt: 1, gridColumn: "1 / -1" }}>
            {paymentCopy.alreadyPaid(formatBRL(checkout.paidAmount))}
          </Typography>
        )}
      </Box>
    </Surface>
  );
}
