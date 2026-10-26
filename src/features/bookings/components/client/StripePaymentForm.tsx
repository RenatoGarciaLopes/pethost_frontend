"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { translateError } from "@/shared/api/errors/translateError";
import { formatBRL } from "@/shared/lib/money";
import { quintalColors } from "@/shared/theme/tokens/colors";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { quintalTypography } from "@/shared/theme/tokens/typography";
import { formatDeadline } from "../../lib/formatStay";
import type { PaymentSession } from "../../api/paymentContracts";
import { paymentCopy as copy } from "../../lib/paymentCopy";

interface StripePaymentFormProps {
  session: PaymentSession;
  returnPath: string;
  onSubmitted: () => Promise<void>;
}

/** Aparência única do iframe Stripe; usa tokens Quintal, sem depender de CSS do documento pai. */
const stripeAppearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: quintalColors.tinta,
    colorText: quintalColors.tinta,
    colorTextSecondary: quintalColors.texto2,
    colorBackground: quintalColors.papel,
    colorDanger: quintalColors.erro,
    borderRadius: `${quintalRadii.field}px`,
    fontFamily: quintalTypography.fontFamily.replace(/var\(--font-body, (.*?)\)/, "$1"),
    fontSizeBase: `${quintalTypography.fontSize}px`,
  },
  rules: {
    ".Input, .Tab": {
      border: `2px solid ${quintalColors.tinta}`,
      backgroundColor: quintalColors.papel,
      boxShadow: "none",
    },
    ".Tab--selected": {
      backgroundColor: quintalColors.grama,
      color: quintalColors.tinta,
      borderColor: quintalColors.tinta,
      boxShadow: "none",
    },
    ".TabLabel--selected, .TabIcon--selected": { color: quintalColors.tinta },
    ".Input:focus, .Tab:focus": {
      outline: `3px solid ${quintalColors.tinta}`,
      outlineOffset: "3px",
      boxShadow: "none",
    },
    ".Label": { color: quintalColors.tinta, fontWeight: "700" },
  },
};

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
        appearance: stripeAppearance,
        fonts: [
          { cssSrc: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;700&display=swap" },
        ],
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
  const [method, setMethod] = useState("pix");
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
          onChange={(event) => setMethod(event.value.type)}
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
        <Button
          type="submit"
          variant="contained"
          fullWidth
          size="large"
          disabled={!stripe || !elements || !ready || sending}
        >
          {sending ? copy.waiting : `${copy.pay} ${formatBRL(session.amount)}`}
        </Button>
        {method === "pix" && (
          <Typography variant="body2">
            {copy.pixDeadline(formatDeadline(new Date(session.pixExpiresAt * 1000).toISOString()))}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
