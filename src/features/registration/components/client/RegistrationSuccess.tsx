"use client";

import { Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useRef } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { registrationCopy } from "../../lib/registrationCopy";
import { REGISTRATION_VARIANTS } from "../../lib/registrationVariants";

const { success } = registrationCopy;

export interface RegistrationSuccessProps {
  /** Conta criada: tutor (apresentar o pet) ou anfitrião (começar a verificação). */
  role: PersonalRole;
  /** Nome completo devolvido pela API; a tela usa só o primeiro nome. */
  fullName: string;
  /** Destino pedido na URL; se for interno e seguro, vira o botão principal. */
  next: string | null;
}

/**
 * "Prazer, {primeiro nome}!" com a comemoração curta e os próximos passos da variante (REQ-OREG-013, REQ-HREG-007).
 * Com `next` seguro, o principal é voltar para lá e o próximo passo da conta vira o secundário.
 * O título recebe o foco ao aparecer. Com movimento reduzido, a comemoração fica parada (CSS global).
 */
export function RegistrationSuccess({ role, fullName, next }: RegistrationSuccessProps) {
  const { message, nextStep, laterHref } = REGISTRATION_VARIANTS[role].success;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstName = fullName.trim().split(/\s+/)[0];
  const back = toSafeInternalPath(next, "/");
  const hasNext = back !== "/";

  useEffect(() => headingRef.current?.focus(), []);

  return (
    <Stack
      spacing={3}
      sx={{ alignItems: "center", textAlign: "center", maxWidth: 560, mx: "auto", py: { xs: 4, md: 8 } }}
    >
      <Celebration>
        <Typography ref={headingRef} variant="h1" tabIndex={-1} sx={{ fontSize: { xs: 34, md: 48 }, outline: "none" }}>
          {success.title(firstName)}
        </Typography>
      </Celebration>
      <Typography sx={{ fontSize: 19 }}>{message}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
        <Button variant="contained" size="large" component={NextLink} href={hasNext ? back : nextStep.href}>
          {hasNext ? success.backToNext : nextStep.label}
        </Button>
        <Button variant="quiet" size="large" component={NextLink} href={hasNext ? nextStep.href : laterHref}>
          {hasNext ? nextStep.label : success.later}
        </Button>
      </Stack>
    </Stack>
  );
}
