"use client";
import { Box, Button, Link, Stack, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { isApiError } from "@/shared/api/errors/ApiError";
import { translateError } from "@/shared/api/errors/translateError";
import { Notice } from "@/shared/ui/feedback/Notice";
import { payoutQueries } from "../../../api/queries";
import { useStartOnboarding } from "../../../hooks/useStartOnboarding";
import { useSyncPayoutAccount } from "../../../hooks/useSyncPayoutAccount";
import { useHostedOnboardingLink } from "../../../hooks/useHostedOnboardingLink";
import { payoutsCopy as copy } from "../../../lib/payoutsCopy";
import type { PayoutAccount } from "../../../types";

const Embedded = dynamic(() => import("../EmbeddedOnboarding").then((module) => module.EmbeddedOnboarding), {
  ssr: false,
  loading: () => <Typography role="status">{copy.loading}</Typography>,
});
const BLOCKING_CODES = [
  "HOST_STRIPE_ACCOUNT_REJECTED",
  "HOST_STRIPE_ONBOARDING_NOT_ALLOWED",
  "HOST_STRIPE_ACCOUNT_ALREADY_EXISTS",
  "HOST_STRIPE_REQUEST_REJECTED",
];
class OnboardingBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function messageFor(account: PayoutAccount): string {
  switch (account.status) {
    case "not_started":
      return copy.explanation;
    case "in_progress":
      return copy.inProgress;
    case "under_review":
      return copy.underReview;
    case "restricted":
      return copy.restricted(copy.requirements[account.missing ?? "other"]);
    case "enabled":
      return account.payoutsEnabled ? copy.enabled : copy.restricted(copy.requirements.other);
    case "rejected":
      return copy.rejected;
  }
}
function HostedFallback({ busy, onOpen }: { busy: boolean; onOpen: () => void }) {
  return (
    <Notice
      tone="info"
      title={copy.loadFailure}
      action={
        <Button variant="outlined" disabled={busy} onClick={onOpen} sx={{ minHeight: { xs: 56, sm: 48 } }}>
          {copy.hosted}
        </Button>
      }
    />
  );
}
/** Conta da sessão anfitriã. A página faz o prefetch; a chave da query é sempre por conta. @example <HostPayouts accountId={user.id} /> */
export interface HostPayoutsProps {
  accountId: string;
}
/** Situação e cadastro de recebimento; dados do Stripe só entram após ação explícita. Exibe projeções seguras, nunca clientSecret ou disabledReason bruto. @example <HostPayouts accountId={user.id} /> */
export function HostPayouts({ accountId }: HostPayoutsProps) {
  const account = useQuery(payoutQueries.account(accountId));
  const createSession = useStartOnboarding(accountId);
  const { mutateAsync: syncAccount, isPending: isSyncing } = useSyncPayoutAccount(accountId);
  const openHosted = useHostedOnboardingLink(accountId);
  const router = useRouter();
  const params = useSearchParams();
  const queryString = params.toString();
  const [embedded, setEmbedded] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [actionError, setActionError] = useState<unknown>(null);
  const [hostedBusy, setHostedBusy] = useState(false);
  const [renewHint, setRenewHint] = useState(false);
  const returnHandled = useRef(false);
  const syncLock = useRef(false);
  const lastAction = useRef<"open" | "sync" | "hosted">("open");
  const heading = useRef<HTMLHeadingElement>(null);
  const busy = isSyncing || hostedBusy;
  const blocked = isApiError(actionError) && BLOCKING_CODES.includes(actionError.code);
  const requestError = useCallback((error: unknown) => {
    setActionError(error);
    setEmbedded(false);
  }, []);
  const scriptUnavailable = useCallback(() => setUnavailable(true), []);
  const synchronize = useCallback(async () => {
    if (syncLock.current) return;
    syncLock.current = true;
    lastAction.current = "sync";
    setActionError(null);
    try {
      await syncAccount();
    } catch (error) {
      setActionError(error);
    } finally {
      syncLock.current = false;
    }
  }, [syncAccount]);
  const exit = useCallback(() => {
    setEmbedded(false);
    void synchronize();
  }, [synchronize]);
  async function hosted() {
    if (hostedBusy) return;
    lastAction.current = "hosted";
    setHostedBusy(true);
    setActionError(null);
    try {
      await openHosted();
    } catch (error) {
      setActionError(error);
    } finally {
      setHostedBusy(false);
    }
  }
  function start() {
    lastAction.current = "open";
    setActionError(null);
    setUnavailable(false);
    setEmbedded(true);
  }
  function retry() {
    if (lastAction.current === "sync") void synchronize();
    else if (lastAction.current === "hosted") void hosted();
    else start();
  }
  useEffect(() => {
    const search = new URLSearchParams(queryString);
    const stripe = search.get("stripe");
    if (returnHandled.current || (stripe !== "retorno" && stripe !== "renovar")) return;
    returnHandled.current = true;
    search.delete("stripe");
    router.replace(`/host/payments${search.size ? `?${search.toString()}` : ""}${window.location.hash}`, {
      scroll: false,
    });
    void synchronize().then(() => {
      if (stripe === "renovar") setRenewHint(true);
    });
  }, [queryString, router, synchronize]);
  useEffect(() => {
    if (embedded) heading.current?.focus();
  }, [embedded]);
  if (account.isPending) return <Typography role="status">{copy.loading}</Typography>;
  if (account.isError)
    return (
      <Notice
        tone="atencao"
        title={translateError(account.error)}
        action={<Button onClick={() => void account.refetch()}>{copy.retry}</Button>}
      />
    );
  if (!account.data)
    return (
      <Stack spacing={2}>
        <Typography>{copy.unverified}</Typography>
        <Link component={NextLink} href="/host/application" sx={{ py: 1 }}>
          {copy.verification}
        </Link>
      </Stack>
    );
  const current = account.data;
  const canStart =
    ["not_started", "in_progress", "restricted"].includes(current.status) ||
    (current.status === "enabled" && !current.payoutsEnabled);
  const fallback = <HostedFallback busy={busy} onOpen={() => void hosted()} />;
  return (
    <Stack spacing={3}>
      {actionError != null && (
        <Notice
          tone="atencao"
          title={translateError(actionError)}
          action={
            !blocked ? (
              <Button disabled={busy} onClick={retry}>
                {copy.retry}
              </Button>
            ) : undefined
          }
        >
          {blocked && copy.support}
        </Notice>
      )}
      {embedded ? (
        <Box component="section" aria-labelledby="payout-onboarding-title">
          <Stack spacing={2}>
            <Link component={NextLink} href="/host">
              {copy.back}
            </Link>
            <Typography component="h2" variant="h5" id="payout-onboarding-title" tabIndex={-1} ref={heading}>
              {copy.embeddedTitle}
            </Typography>
            {unavailable ? (
              fallback
            ) : (
              <OnboardingBoundary fallback={fallback}>
                <Embedded
                  createSession={createSession}
                  onExit={exit}
                  onRequestError={requestError}
                  onUnavailable={scriptUnavailable}
                />
              </OnboardingBoundary>
            )}
            <Button variant="text" onClick={exit} disabled={busy}>
              {copy.close}
            </Button>
          </Stack>
        </Box>
      ) : (
        <>
          <Notice
            tone={current.status === "enabled" && current.payoutsEnabled ? "ok" : "info"}
            title={messageFor(current)}
          />
          {current.status === "not_started" && <Typography color="text.secondary">{copy.stripeHelp}</Typography>}
          {renewHint && canStart && <Typography role="status">{copy.renewed}</Typography>}
          {current.status === "rejected" && <Typography>{copy.support}</Typography>}
          {canStart && !blocked && (
            <Button
              variant="contained"
              onClick={start}
              disabled={busy}
              sx={{ alignSelf: "flex-start", minHeight: { xs: 56, sm: 48 } }}
            >
              {current.status === "not_started"
                ? copy.start
                : current.status === "restricted"
                  ? copy.resolve
                  : copy.continue}
            </Button>
          )}
          {current.status === "under_review" && (
            <Button
              variant="outlined"
              disabled={busy}
              onClick={() => void synchronize()}
              sx={{ alignSelf: "flex-start", minHeight: { xs: 56, sm: 48 } }}
            >
              {copy.refresh}
            </Button>
          )}
          {current.status === "enabled" && current.payoutsEnabled && (
            <Button
              component={NextLink}
              href="/host/listings"
              variant="contained"
              sx={{ alignSelf: "flex-start", minHeight: { xs: 56, sm: 48 } }}
            >
              {copy.next}
            </Button>
          )}
        </>
      )}
    </Stack>
  );
}
