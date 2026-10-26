"use client";
import { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { loadConnectAndInitialize } from "@stripe/connect-js/pure";
import type { StripeConnectInstance } from "@stripe/connect-js";
import { ConnectComponentsProvider, ConnectAccountOnboarding } from "@stripe/react-connect-js";
import { ApiError } from "@/shared/api/errors/ApiError";
import type { OnboardingSessionDto } from "../../../api/contracts";
import { toStripeAppearance } from "../../../lib/toStripeAppearance";
import { payoutsCopy } from "../../../lib/payoutsCopy";
/** Somente callbacks client, nunca um segredo recebido como prop serializada. @example <EmbeddedOnboarding createSession={createSession} onExit={sync} onRequestError={report} onUnavailable={showFallback} /> */
export interface EmbeddedOnboardingProps {
  createSession: () => Promise<OnboardingSessionDto>;
  onExit: () => void;
  onRequestError: (error: unknown) => void;
  onUnavailable: () => void;
}
/** Única fronteira runtime dos SDKs Stripe. A sessão inicial fornece a chave publicável e seu segredo é consumido uma vez, apenas em closure. Renovação sempre cria outra sessão. @example <EmbeddedOnboarding {...callbacks} /> */
export function EmbeddedOnboarding({ createSession, onExit, onRequestError, onUnavailable }: EmbeddedOnboardingProps) {
  const theme = useTheme();
  const [connect, setConnect] = useState<StripeConnectInstance | null>(null);
  useEffect(() => {
    let cancelled = false;
    let instance: StripeConnectInstance | null = null;
    let first: OnboardingSessionDto | null = null;
    // O iframe não consegue avisar onLoadError quando o próprio script foi bloqueado.
    const handleScriptFailure = (event: Event) => {
      const script = event.target;
      if (
        script instanceof HTMLScriptElement &&
        new URL(script.src, window.location.href).hostname === "connect-js.stripe.com"
      )
        onUnavailable();
    };
    window.addEventListener("error", handleScriptFailure, true);
    async function initialize() {
      first = await createSession();
      if (cancelled) {
        first = null;
        return;
      }
      try {
        instance = loadConnectAndInitialize({
          publishableKey: first.publishableKey,
          locale: "pt-BR",
          appearance: toStripeAppearance(theme),
          fetchClientSecret: async () => {
            if (cancelled) throw new Error("Onboarding closed");
            const initial = first;
            first = null;
            try {
              const session = initial && initial.expiresAt * 1000 > Date.now() ? initial : await createSession();
              if (session.expiresAt * 1000 <= Date.now())
                throw new ApiError({
                  code: "HOST_STRIPE_UNAVAILABLE",
                  status: 503,
                  message: "Expired onboarding session",
                });
              return session.clientSecret;
            } catch (error) {
              onRequestError(error);
              throw new Error("Onboarding session unavailable");
            }
          },
        });
        setConnect(instance);
      } catch {
        first = null;
        onUnavailable();
      }
    }
    void initialize().catch(onRequestError);
    return () => {
      cancelled = true;
      first = null;
      window.removeEventListener("error", handleScriptFailure, true);
      // Logout best effort no teardown: nunca registra segredo ou erro do SDK.
      if (instance)
        void instance.logout().catch(() => {
          instance = null;
        });
    };
  }, [createSession, theme, onRequestError, onUnavailable]);
  if (!connect) return <Typography role="status">{payoutsCopy.loading}</Typography>;
  return (
    <ConnectComponentsProvider connectInstance={connect}>
      <ConnectAccountOnboarding onExit={onExit} onLoadError={() => onUnavailable()} />
    </ConnectComponentsProvider>
  );
}
