"use client";

import { Box, Button, Divider, FormControl, InputLabel, Link, Select, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { formatBRL, fromCents } from "@/shared/lib/money";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { Notice } from "@/shared/ui/feedback/Notice";
import { useBookingPayment } from "../../hooks/useBookingPayment";
import { ownerBookingPath, ownerBookingPaymentPath } from "../../lib/bookingPaths";
import { formatDeadline, formatPeriod } from "../../lib/formatStay";
import { paymentCopy as copy } from "../../lib/paymentCopy";
import { isPaymentConfirmed, nextPayableInstallment, paymentWindowClosed } from "../../lib/paymentState";
import { StripePaymentForm } from "./StripePaymentForm";
import { DoorMark } from "@/shared/ui/brand/DoorMark";

/** 066: checkout owner, isolado por conta, com confirmação somente após releitura da API. */
export function BookingPayment({
  accountId,
  bookingId,
  coverUrl,
}: {
  accountId: string;
  bookingId: string;
  coverUrl?: string;
}) {
  const state = useBookingPayment(accountId, bookingId);
  return <BookingPaymentView state={state} bookingId={bookingId} coverUrl={coverUrl} />;
}

/** Apresentação do checkout e seus estados; a composição é dona das chamadas e do cache. */
export function BookingPaymentView({
  state,
  bookingId,
  coverUrl,
}: {
  state: ReturnType<typeof useBookingPayment>;
  bookingId: string;
  coverUrl?: string;
}) {
  const [count, setCount] = useState<number | null>(null);
  const [failedPhoto, setFailedPhoto] = useState(false);
  const success =
    !!state.payment.data &&
    !!state.booking.data &&
    state.celebrate &&
    isPaymentConfirmed(state.payment.data, state.booking.data.status);
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (success) titleRef.current?.focus();
  }, [success]);
  const failure = state.booking.error ?? state.payment.error ?? state.error;
  if (isApiError(failure) && failure.status === 404) notFound();
  if (state.booking.isPending || state.payment.isPending) return <SniffLoader label={copy.loading} />;
  if (!state.booking.data || !state.payment.data)
    return (
      <ErrorState
        title={copy.unavailable}
        description={translateError(failure)}
        onRetry={() => {
          void state.booking.refetch();
          void state.payment.refetch();
        }}
      />
    );
  const booking = state.booking.data;
  const payment = state.payment.data;
  const installment = nextPayableInstallment(payment);
  const selected =
    count !== null && payment.options?.some((o) => o.count === count)
      ? count
      : (payment.installmentCount ?? payment.options?.[0]?.count ?? 1);
  const option = payment.options?.find((o) => o.count === selected);
  const closed =
    payment.status === "cancelled" || ["cancelled", "expired", "declined", "requested"].includes(booking.status);
  const expired = paymentWindowClosed(payment, state.now);
  const canOpen = !closed && !expired && (installment || payment.status === "not_started");
  const configured = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith("pk_test_");
  return (
    <Stack spacing={3}>
      <Link component={NextLink} href={ownerBookingPath(bookingId)} sx={{ alignSelf: "flex-start" }}>
        {copy.back}
      </Link>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 340px" },
          gap: 4,
          alignItems: "start",
        }}
      >
        <Stack spacing={3}>
          <Typography
            variant="h1"
            ref={titleRef}
            tabIndex={success ? -1 : undefined}
            sx={{ fontSize: { xs: 28, md: 34 } }}
          >
            {success ? copy.success : copy.title}
          </Typography>
          {success ? (
            <Stack spacing={2}>
              <Typography role="status">{copy.successBody}</Typography>
              <Button variant="contained" href={ownerBookingPath(bookingId)}>
                {copy.view}
              </Button>
            </Stack>
          ) : (
            <>
              {payment.paymentDeadline && payment.status !== "active" && payment.status !== "paid" && (
                <Typography>{copy.deadline(formatDeadline(payment.paymentDeadline, new Date(state.now)))}</Typography>
              )}
              {failure ? <Notice tone="atencao" title={translateError(failure)} /> : null}
              {closed || expired ? (
                <Notice tone="atencao" title={expired ? copy.expired : copy.closed} />
              ) : payment.status === "paid" ? (
                <Notice tone="ok" title={copy.paid} />
              ) : (
                <>
                  {!state.session && !!payment.options?.length && (
                    <FormControl fullWidth disabled={state.busy}>
                      <InputLabel htmlFor="payment-plan">{copy.plan}</InputLabel>
                      <Select
                        native
                        label={copy.plan}
                        inputProps={{ id: "payment-plan" }}
                        value={selected}
                        onChange={(e) => setCount(Number(e.target.value))}
                      >
                        {payment.options.map((plan) => (
                          <option key={plan.count} value={plan.count}>
                            {plan.count === 1
                              ? copy.atSight(formatBRL(plan.firstAmount))
                              : copy.planLabel(plan.count, formatBRL(plan.firstAmount))}
                          </option>
                        ))}
                      </Select>
                      <Typography variant="body2" color="text.secondary">
                        {copy.separate}
                      </Typography>
                    </FormControl>
                  )}
                  {!state.session && (
                    <Box component="ol" aria-label={copy.dueDates} sx={{ pl: 2.5, m: 0 }}>
                      {(option?.installments ?? payment.installments).map((i) => (
                        <li key={i.number}>
                          {copy.installmentLabel(
                            i.number,
                            formatBRL(i.amount),
                            formatDeadline(i.dueAt, new Date(state.now)),
                          )}
                        </li>
                      ))}
                    </Box>
                  )}
                  <Box
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: `${quintalRadii.media}px`,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{copy.reminder}</Typography>
                  </Box>
                  {state.session && !state.waiting ? (
                    <Stack spacing={2}>
                      <Typography variant="h2" sx={{ fontSize: 20 }}>
                        {copy.form}
                      </Typography>
                      {!!state.session.lateFee && (
                        <Typography>{copy.lateFee(formatBRL(state.session.lateFee))}</Typography>
                      )}
                      <StripePaymentForm
                        session={state.session}
                        returnPath={ownerBookingPaymentPath(bookingId)}
                        onSubmitted={() => state.synchronize(state.session?.installmentNumber === 1)}
                      />
                      <Typography variant="body2">
                        {copy.pixDeadline(
                          formatDeadline(
                            new Date(state.session.pixExpiresAt * 1000).toISOString(),
                            new Date(state.now),
                          ),
                        )}
                      </Typography>
                      <Button variant="text" onClick={state.resetSession}>
                        {copy.change}
                      </Button>
                    </Stack>
                  ) : state.waiting || !canOpen ? (
                    <Stack spacing={2} aria-live="polite">
                      <Typography variant="h2" sx={{ fontSize: 20 }}>
                        {copy.waiting}
                      </Typography>
                      <Typography>{copy.waitingBody}</Typography>
                      <Button variant="outlined" onClick={() => void state.synchronize()} disabled={state.busy}>
                        {state.busy ? copy.sending : copy.check}
                      </Button>
                    </Stack>
                  ) : (
                    <>
                      {!configured && <Typography role="alert">{copy.unavailable}</Typography>}
                      <Button
                        variant="contained"
                        disabled={state.busy || !configured}
                        onClick={() => void state.open(selected)}
                        sx={{ alignSelf: "flex-start" }}
                      >
                        {state.busy ? copy.loading : copy.open}
                      </Button>
                    </>
                  )}
                </>
              )}
              <Typography variant="body2" color="text.secondary">
                {copy.guarantee}
              </Typography>
            </>
          )}
        </Stack>
        <Box
          component="aside"
          aria-label={copy.summary}
          sx={{
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: `${quintalRadii.card}px`,
            overflow: "hidden",
          }}
        >
          {coverUrl && !failedPhoto ? (
            <Box
              component="img"
              src={coverUrl}
              alt={booking.listing?.title ?? copy.yourPlace}
              onError={() => setFailedPhoto(true)}
              sx={{ width: "100%", height: 210, objectFit: "cover", display: "block" }}
            />
          ) : (
            <Box
              sx={{ minHeight: 150, bgcolor: "background.paper", display: "grid", placeItems: "center", gap: 1, p: 3 }}
            >
              <DoorMark width={48} interactive={false} />
              <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                {copy.noPhoto}
              </Typography>
            </Box>
          )}
          <Stack spacing={2} sx={{ p: 3 }}>
            <Box>
              <Typography variant="h2" sx={{ fontSize: 20 }}>
                {booking.pets
                  .map((p) => p.name)
                  .filter(Boolean)
                  .join(", ") || copy.yourPets}
              </Typography>
              <Typography sx={{ fontWeight: 600 }}>{booking.listing?.title ?? copy.yourPlace}</Typography>
              {booking.host && <Typography variant="body2">{copy.host(booking.host.name)}</Typography>}
              <Typography variant="body2">{formatPeriod(booking.checkIn, booking.checkOut)}</Typography>
              <Typography variant="body2">
                {copy.nights(booking.nights, booking.listing?.neighborhood ?? copy.neighborhood)}
              </Typography>
            </Box>
            <Divider />
            <Typography variant="body2">
              {copy.bill(formatBRL(fromCents(booking.nightlyRateCents)), booking.nights, booking.petCount)}
            </Typography>
            <Stack direction="row" sx={{ justifyContent: "space-between", fontWeight: 800 }}>
              <span>{copy.total}</span>
              <span>{formatBRL(payment.totalAmount)}</span>
            </Stack>
            {!!payment.paidAmount && (
              <Typography variant="body2">{copy.alreadyPaid(formatBRL(payment.paidAmount))}</Typography>
            )}
          </Stack>
        </Box>
      </Box>
    </Stack>
  );
}
