"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/api/errors/ApiError";
import { paymentMutations } from "../api/client/paymentMutations.client";
import type { PaymentSession } from "../api/paymentContracts";
import { paymentQuery } from "../api/paymentQueries";
import { bookingQueries } from "../api/queries";
import { isPaymentConfirmed, nextPayableInstallment, paymentWindowClosed } from "../lib/paymentState";

/** Coordena sessões efêmeras e atualização autoritativa. Não confirma localmente nem persiste segredos.
 * A celebração exibida é consumida ao ocultar a página (Activity do router); cache financeiro é preservado.
 */
export function useBookingPayment(accountId: string, bookingId: string) {
  const client = useQueryClient();
  const booking = useQuery(bookingQueries.detail(accountId, bookingId));
  const [waiting, setWaiting] = useState(false);
  const payment = useQuery({
    ...paymentQuery(accountId, bookingId),
    refetchInterval: waiting ? 10000 : false,
    refetchIntervalInBackground: false,
  });
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [celebrate, setCelebrate] = useState(false);
  const displayedCelebration = useRef(false);
  useLayoutEffect(() => {
    if (celebrate && payment.data && booking.data && isPaymentConfirmed(payment.data, booking.data.status))
      displayedCelebration.current = true;
  }, [celebrate, payment.data, booking.data]);
  useLayoutEffect(
    () => () => {
      // Next preserves useState across navigation with Activity, but runs layout cleanups when hiding.
      // Only consume an actually displayed confirmation: StrictMode setup/cleanup must not lose Stripe returns.
      if (displayedCelebration.current) {
        displayedCelebration.current = false;
        setCelebrate(false);
      }
    },
    [],
  );
  const locked = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const refreshedDeadline = useRef<string | null>(null);
  const attemptedInstallment = useRef<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const refreshBooking = useCallback(async () => {
    await client.invalidateQueries({ queryKey: bookingQueries.detail(accountId, bookingId).queryKey });
    await client.invalidateQueries({ queryKey: bookingQueries.lists(accountId) });
  }, [client, accountId, bookingId]);

  const run = useCallback(
    async (operation: () => Promise<void>) => {
      if (locked.current) return;
      locked.current = true;
      setBusy(true);
      setError(null);
      try {
        await operation();
      } catch (cause) {
        setError(cause);
        if (isApiError(cause) && [409, 422].includes(cause.status)) {
          setSession(null);
          await client.invalidateQueries({ queryKey: paymentQuery(accountId, bookingId).queryKey });
          await refreshBooking();
        }
      } finally {
        locked.current = false;
        setBusy(false);
      }
    },
    [client, accountId, bookingId, refreshBooking],
  );

  const synchronize = useCallback(
    (first = false) =>
      run(async () => {
        setWaiting(true);
        if (first) {
          setCelebrate(true);
          attemptedInstallment.current = 1;
        }
        const data = await paymentMutations.synchronize(bookingId);
        client.setQueryData(paymentQuery(accountId, bookingId).queryKey, data);
        await refreshBooking();
        if (
          data.status === "paid" ||
          data.installments.some((i) => i.number === attemptedInstallment.current && i.status === "paid")
        ) {
          setWaiting(false);
          setSession(null);
        }
      }),
    [run, bookingId, client, accountId, refreshBooking],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("payment_return") && !url.searchParams.has("payment_intent_client_secret")) return;
    // Remove também o client secret acrescentado pelo SDK antes de qualquer outra navegação.
    const first = url.searchParams.get("installment") === "1";
    const installment = Number(url.searchParams.get("installment"));
    if (Number.isInteger(installment) && installment >= 1 && installment <= 6)
      attemptedInstallment.current = installment;
    window.history.replaceState(null, "", url.pathname);
    void synchronize(first);
  }, [synchronize]);

  useEffect(() => {
    if (!waiting || !payment.data?.installments.some((i) => i.number === 1 && i.status === "paid")) return;
    void refreshBooking().then(() => {
      if (payment.data?.installments.some((i) => i.number === attemptedInstallment.current && i.status === "paid")) {
        setWaiting(false);
        setSession(null);
      }
    });
  }, [payment.data, waiting, refreshBooking]);

  const deadline = payment.data?.paymentDeadline;
  const expired = !!payment.data && paymentWindowClosed(payment.data, now);
  useEffect(() => {
    if (!expired || !deadline || refreshedDeadline.current === deadline) return;
    refreshedDeadline.current = deadline;
    void client.invalidateQueries({ queryKey: paymentQuery(accountId, bookingId).queryKey });
    void refreshBooking();
  }, [expired, deadline, client, accountId, bookingId, refreshBooking]);

  const open = (count: number) =>
    run(async () => {
      let data = payment.data;
      if (!data || paymentWindowClosed(data, Date.now())) return;
      if (data.status === "not_started" || (data.options?.length && data.installmentCount !== count)) {
        data = await paymentMutations.choose(bookingId, count);
        client.setQueryData(paymentQuery(accountId, bookingId).queryKey, data);
      }
      const installment = nextPayableInstallment(data);
      if (!installment) return;
      attemptedInstallment.current = installment.number;
      setSession(await paymentMutations.session(bookingId, installment.number));
      setWaiting(false);
    });

  return {
    booking,
    payment,
    session,
    busy,
    error,
    now,
    waiting,
    celebrate,
    open,
    synchronize,
    resetSession: () => {
      setSession(null);
      setWaiting(false);
      setError(null);
    },
  };
}
