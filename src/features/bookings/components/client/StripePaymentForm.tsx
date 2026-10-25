"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { formatBRL } from "@/shared/lib/money";
import { quintalColors } from "@/shared/theme/tokens/colors";
import type { PaymentSession } from "../../api/paymentContracts";
import { paymentCopy as copy } from "../../lib/paymentCopy";

interface StripePaymentFormProps {
  session: PaymentSession;
  returnPath: string;
  onSubmitted: () => Promise<void>;
}

/** Checkout Stripe real. Chave pública só do env; sem suporte a confirmação simulada em produção. */
export function StripePaymentForm(props: StripePaymentFormProps) {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  const stripe = useMemo(() => (key?.startsWith("pk_test_") ? loadStripe(key).catch(() => null) : null), [key]);
  if (!stripe) return <Typography role="alert">{copy.unavailable}</Typography>;
  return (
    <Elements
      stripe={stripe}
      options={{
        clientSecret: props.session.clientSecret,
        locale: "pt-BR",
        appearance: { theme: "stripe", variables: { colorPrimary: quintalColors.tinta, borderRadius: "12px" } },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}

function PaymentForm({ session, returnPath, onSubmitted }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [sending, setSending] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitted = useRef(false);
  useEffect(() => {
    if (ready) return;
    const timeout = setTimeout(() => setError(copy.unavailable), 15000);
    return () => clearTimeout(timeout);
  }, [ready]);
  return (
    <Box
      component="form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements || submitted.current || !ready) return;
        submitted.current = true;
        setSending(true);
        setError(null);
        try {
          const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: new URL(
                `${returnPath}?payment_return=1&installment=${session.installmentNumber}`,
                window.location.origin,
              ).href,
            },
            redirect: "if_required",
          });
          if (result.error) {
            setError(translateError(result.error));
            return;
          }
          await onSubmitted();
        } catch (cause) {
          setError(translateError(cause));
        } finally {
          submitted.current = false;
          setSending(false);
        }
      }}
    >
      <Stack spacing={2}>
        <PaymentElement
          options={{ layout: "tabs", paymentMethodOrder: ["pix", "card"] }}
          onReady={() => {
            setReady(true);
            setError(null);
          }}
          onLoadError={() => {
            setReady(false);
            setError(copy.unavailable);
          }}
        />
        {error && (
          <Typography role="alert" color="error">
            {error}
          </Typography>
        )}
        {!ready && !error && <Typography role="status">{copy.loading}</Typography>}
        <Button type="submit" variant="contained" disabled={!stripe || !elements || !ready || sending}>
          {sending ? copy.waiting : `${copy.pay} ${formatBRL(session.amount)}`}
        </Button>
      </Stack>
    </Box>
  );
}
