"use client";

import { Button, Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useId, useState } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { loginRedirectPath, registerPath } from "@/shared/config/appRoutes";
import { ChoiceCardGroup } from "@/shared/ui/forms/ChoiceCardGroup";
import { Reveal } from "@/shared/ui/motion/Reveal";
import { registrationCopy } from "../../lib/registrationCopy";

const { choice } = registrationCopy;

const OPTIONS = (["owner", "host"] as const).map((role) => ({ value: role, ...choice[role] }));

const isPersonalRole = (value: string): value is PersonalRole => value === "owner" || value === "host";

export interface RegisterChoiceProps {
  /** Destino pedido na URL; vai junto para o formulário e para o login (REQ-OREG-001). */
  next: string | null;
}

/**
 * Porta de entrada do cadastro (`/register`, REQ-OREG-001): dois cartões grandes (tutor ou anfitrião),
 * nenhum marcado, e o botão que diz para onde vai. O `next` seguro acompanha a escolha.
 *
 * @example <RegisterChoice next="/hosts/42" />
 */
export function RegisterChoice({ next }: RegisterChoiceProps) {
  const [role, setRole] = useState<PersonalRole | "">("");
  const hintId = useId();

  return (
    <Stack spacing={4}>
      <Reveal order={0}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 44 } }}>
          {choice.title}
        </Typography>
      </Reveal>
      <Reveal order={1}>
        <ChoiceCardGroup
          label={choice.legend}
          options={OPTIONS}
          value={role}
          onChange={(value) => isPersonalRole(value) && setRole(value)}
        />
      </Reveal>
      <Reveal order={2}>
        <Stack spacing={2}>
          {role ? (
            <Button variant="contained" size="large" component={NextLink} href={registerPath(role, next)}>
              {choice.continueAs[role]}
            </Button>
          ) : (
            <>
              <Button variant="contained" size="large" disabled aria-describedby={hintId}>
                {choice.continue}
              </Button>
              <Typography id={hintId} color="text.secondary">
                {choice.pickFirst}
              </Typography>
            </>
          )}
          <Typography sx={{ textAlign: "center" }}>
            {choice.hasAccount}{" "}
            <Link component={NextLink} href={loginRedirectPath(next)}>
              {choice.login}
            </Link>
          </Typography>
        </Stack>
      </Reveal>
    </Stack>
  );
}
