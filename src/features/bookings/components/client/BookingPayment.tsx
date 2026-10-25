"use client";

import { Box, Button, Chip, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { notFound } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { formatBRL } from "@/shared/lib/money";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { StaySummary } from "./StaySummary";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { Notice } from "@/shared/ui/feedback/Notice";
import { useBookingPayment } from "../../hooks/useBookingPayment";
import { ownerBookingPath, ownerBookingPaymentPath } from "../../lib/bookingPaths";
import { formatDeadline } from "../../lib/formatStay";
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
      <Link
        component={NextLink}
        href={ownerBookingPath(bookingId)}
        sx={{ alignSelf: "flex-start", fontWeight: 700, textDecoration: "underline" }}
      >
        <span aria-hidden="true">← </span>
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
        <Stack spacing={3} sx={{ minWidth: 0 }}>
          <Typography
            variant="h1"
            ref={titleRef}
            tabIndex={success ? -1 : undefined}
            sx={{ fontSize: { xs: 30, md: 38 } }}
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
                    <Stack spacing={1.5}>
                      <ChoiceCardGroup
                        label={copy.plan}
                        layout="responsive"
                        disabled={state.busy}
                        value={String(selected)}
                        onChange={(value) => setCount(Number(value))}
                        options={payment.options.map((plan) => ({
                          value: String(plan.count),
                          label:
                            plan.count === 1
                              ? copy.atSight(formatBRL(plan.firstAmount))
                              : copy.planLabel(
                                  plan.count,
                                  plan.installments.map((i) => formatBRL(i.amount)).join(" + "),
                                ),
                        }))}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {copy.separate}
                      </Typography>
                    </Stack>
                  )}
                  {!state.session && (
                    <Box
                      component="ol"
                      aria-label={copy.dueDates}
                      sx={{
                        listStyle: "none",
                        p: 0,
                        m: 0,
                        border: "2px solid",
                        borderColor: "text.primary",
                        borderRadius: "18px",
                        overflow: "hidden",
                      }}
                    >
                      {(option?.installments ?? payment.installments).map((i) => (
                        <Stack
                          component="li"
                          key={i.number}
                          spacing={1}
                          sx={{ p: 2, "& + li": { borderTop: "2px dashed", borderColor: "divider" } }}
                        >
                          <Stack
                            direction="row"
                            sx={{ justifyContent: "space-between", alignItems: "baseline", gap: 1 }}
                          >
                            <Typography sx={{ fontWeight: 700 }}>{copy.installment(i.number)}</Typography>
                            <Typography sx={{ fontWeight: 800, fontSize: 20 }}>{formatBRL(i.amount)}</Typography>
                          </Stack>
                          <Chip
                            label={formatDeadline(i.dueAt, new Date(state.now))}
                            sx={{
                              alignSelf: "flex-start",
                              maxWidth: "100%",
                              height: "auto",
                              "& .MuiChip-label": { whiteSpace: "normal", py: 0.5 },
                            }}
                          />
                          {"lateFee" in i && !!i.lateFee && (
                            <Typography variant="body2">{copy.lateFee(formatBRL(Number(i.lateFee)))}</Typography>
                          )}
                        </Stack>
                      ))}
                    </Box>
                  )}
                  <Notice tone="ok" title={copy.reminder} />
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
                      {!configured && <Notice tone="atencao" title={copy.unconfigured} />}
                      <Button
                        variant="contained"
                        disabled={state.busy || !configured}
                        onClick={() => void state.open(selected)}
                        fullWidth
                        size="large"
                      >
                        {state.busy ? copy.loading : copy.open}
                      </Button>
                    </>
                  )}
                </>
              )}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Box
                  component="svg"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  sx={{ width: 24, height: 24, flexShrink: 0, fill: "none", stroke: "currentColor", strokeWidth: 2 }}
                >
                  <rect x="4" y="10" width="16" height="12" rx="3" />
                  <path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v4" />
                </Box>
                <Typography variant="body2">{copy.guarantee}</Typography>
              </Stack>
            </>
          )}
        </Stack>
        <Box
          component="aside"
          aria-label={copy.summary}
          sx={{ gridRow: { xs: 1, md: "auto" }, gridColumn: { md: 2 }, minWidth: 0 }}
        >
          <StaySummary
            booking={booking}
            checkout={{ totalAmount: payment.totalAmount, paidAmount: payment.paidAmount }}
            cover={
              coverUrl && !failedPhoto ? (
                <Box
                  component="img"
                  src={coverUrl}
                  alt={booking.listing?.title ?? copy.yourPlace}
                  onError={() => setFailedPhoto(true)}
                  sx={{ width: "100%", height: { xs: 72, md: 210 }, objectFit: "cover", display: "block" }}
                />
              ) : (
                <Box
                  sx={{
                    minHeight: { xs: 70, md: 150 },
                    bgcolor: "background.paper",
                    display: "grid",
                    placeItems: "center",
                    gap: 1,
                    p: 3,
                  }}
                >
                  <DoorMark width={48} interactive={false} />
                  <Typography color="text.secondary" sx={{ textAlign: "center" }}>
                    {copy.noPhoto}
                  </Typography>
                </Box>
              )
            }
          />
        </Box>
      </Box>
    </Stack>
  );
}
