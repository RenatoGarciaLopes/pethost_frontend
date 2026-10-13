"use client";

import { Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import { forgotPasswordPath, LOGIN_PATH } from "@/shared/config/appRoutes";
import { useUrlSecret } from "@/shared/hooks/useUrlSecret";
import { Notice } from "@/shared/ui/feedback/Notice";
import { passwordCopy } from "../../lib/passwordCopy";
import { ResetPasswordForm } from "./ResetPasswordForm";
import { StepHeading } from "./StepHeading";

const { reset, done } = passwordCopy;

/** Desfecho do formulário; antes dele, a etapa vem do token da URL. */
type Outcome = "expired" | "missing" | "done";

/**
 * Senha nova (spec 013): lê o token do link (`#token=` ou `?token=`), tira da barra de endereço e o guarda só
 * em memória (REQ-PWD-005). Sem token, link vencido e senha trocada são etapas próprias, sem formulário
 * (REQ-PWD-006, 010, 011). Trocar de etapa leva o foco ao título novo.
 *
 * @example <ResetPasswordFlow />
 */
export function ResetPasswordFlow() {
  const token = useUrlSecret("token");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (outcome) headingRef.current?.focus();
  }, [outcome]);

  // Antes de ler a URL (primeira renderização no navegador): nada a mostrar ainda.
  if (token === undefined) return null;

  if (outcome === "done") return <ResetDone headingRef={headingRef} />;
  if (outcome === "expired") return <RequestNewLink headingRef={headingRef} message={reset.expired} />;
  if (outcome === "missing" || token === null) {
    return <RequestNewLink headingRef={headingRef} message={reset.incomplete} />;
  }

  return (
    <ResetPasswordForm
      token={token}
      onDone={() => setOutcome("done")}
      onTokenRejected={(reason) => setOutcome(reason)}
    />
  );
}

/** Link incompleto ou vencido: o caminho para pedir outro, sem formulário (REQ-PWD-006, 010). */
function RequestNewLink({
  headingRef,
  message,
}: {
  headingRef: RefObject<HTMLHeadingElement | null>;
  message: string;
}) {
  return (
    <Stack spacing={3}>
      <StepHeading ref={headingRef}>{reset.title}</StepHeading>
      <Notice tone="atencao">{message}</Notice>
      <Button variant="contained" size="large" component={NextLink} href={forgotPasswordPath()}>
        {reset.requestNew}
      </Button>
    </Stack>
  );
}

/** Senha trocada: todas as sessões saíram; o caminho é entrar de novo (REQ-PWD-011). */
function ResetDone({ headingRef }: { headingRef: RefObject<HTMLHeadingElement | null> }) {
  return (
    <Stack spacing={3}>
      <StepHeading ref={headingRef}>{done.title}</StepHeading>
      <Typography sx={{ fontSize: 18 }}>{done.body}</Typography>
      <Button variant="contained" size="large" component={NextLink} href={LOGIN_PATH}>
        {done.login}
      </Button>
    </Stack>
  );
}
