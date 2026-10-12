"use client";

import { Button, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useEffect, useRef } from "react";
import { homeOf } from "@/shared/config/appRoutes";
import { toSafeInternalPath } from "@/shared/lib/url/toSafeInternalPath";
import { Celebration } from "@/shared/ui/brand/Celebration";
import { registrationCopy } from "../../lib/registrationCopy";

/** Tela de apresentar o pet (spec 021). */
const NEW_PET_PATH = "/pets/new";

const { success } = registrationCopy;

export interface RegistrationSuccessProps {
  /** Nome completo devolvido pela API; a tela usa só o primeiro nome. */
  fullName: string;
  /** Destino pedido na URL; se for interno e seguro, vira o botão principal. */
  next: string | null;
}

/**
 * "Prazer, {primeiro nome}!" com a comemoração curta e os próximos passos (REQ-OREG-013).
 * O título recebe o foco ao aparecer. Com movimento reduzido, a comemoração fica parada (CSS global).
 */
export function RegistrationSuccess({ fullName, next }: RegistrationSuccessProps) {
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
      <Typography sx={{ fontSize: 19 }}>{success.owner}</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ width: { xs: "100%", sm: "auto" } }}>
        <Button variant="contained" size="large" component={NextLink} href={hasNext ? back : NEW_PET_PATH}>
          {hasNext ? success.backToNext : success.addPet}
        </Button>
        <Button variant="quiet" size="large" component={NextLink} href={hasNext ? NEW_PET_PATH : homeOf("owner")}>
          {hasNext ? success.addPet : success.later}
        </Button>
      </Stack>
    </Stack>
  );
}
