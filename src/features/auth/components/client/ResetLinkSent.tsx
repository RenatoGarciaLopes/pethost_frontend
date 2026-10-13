"use client";

import { Button, Stack, Typography } from "@mui/material";
import { useEffect, useState, type RefObject } from "react";
import { useCountdown } from "@/shared/hooks/useCountdown";
import { Notice } from "@/shared/ui/feedback/Notice";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { useRequestPasswordResetMutation } from "../../hooks/usePasswordMutations";
import { passwordCopy } from "../../lib/passwordCopy";
import type { ForgotPasswordValues } from "../../schemas/forgotPasswordSchema";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { StepHeading } from "./StepHeading";

/** Espera para mandar de novo (REQ-PWD-004). */
const RESEND_AFTER_SECONDS = 60;

const { sent } = passwordCopy;

export interface ResetLinkSentProps {
  headingRef: RefObject<HTMLHeadingElement | null>;
  /** O pedido feito, para reenviar igual. Não aparece na tela (REQ-PWD-003). */
  values: ForgotPasswordValues;
  onUseOtherEmail: () => void;
}

/**
 * Link enviado (REQ-PWD-002 a 004): o mesmo texto para qualquer e-mail, sem nenhum dado da conta;
 * "Mandar de novo" libera depois de 60 s e avisa que só o link mais novo vale.
 * A contagem visível muda a cada segundo, mas o leitor de tela só ouve o começo e o fim
 * (a parte que conta fica fora da região viva).
 *
 * @example <ResetLinkSent headingRef={ref} values={values} onUseOtherEmail={() => …} />
 */
export function ResetLinkSent({ headingRef, values, onUseOtherEmail }: ResetLinkSentProps) {
  const mutation = useRequestPasswordResetMutation();
  const notice = useErrorNotice();
  const countdown = useCountdown();
  const { start } = countdown;
  const [resent, setResent] = useState(false);

  useEffect(() => start(RESEND_AFTER_SECONDS), [start]);

  function resend() {
    if (mutation.isPending) return;
    notice.clear();
    mutation.mutate(values, {
      onSuccess: () => {
        setResent(true);
        start(RESEND_AFTER_SECONDS);
      },
      onError: notice.report,
    });
  }

  const waiting = countdown.isRunning;

  return (
    <Stack spacing={3}>
      <StepHeading ref={headingRef}>{sent.title}</StepHeading>
      <Typography sx={{ fontSize: 18 }}>{sent.body}</Typography>
      {resent && <Notice tone="info">{sent.onlyNewest}</Notice>}
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <Typography color="text.secondary">
        <span aria-live="polite">{sent.spam}</span>{" "}
        {waiting ? (
          <span aria-hidden="true">{sent.resendIn(countdown.remaining)}</span>
        ) : (
          <span aria-live="polite">{sent.resendNow}</span>
        )}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          variant="contained"
          size="large"
          onClick={resend}
          disabled={waiting || mutation.isPending || notice.blocked}
          aria-busy={mutation.isPending}
        >
          {mutation.isPending ? sent.resending : sent.resend}
        </Button>
        <Button variant="quiet" size="large" onClick={onUseOtherEmail}>
          {sent.otherEmail}
        </Button>
      </Stack>
    </Stack>
  );
}
