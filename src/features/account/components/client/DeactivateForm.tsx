"use client";

import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { homeOf, loginNoticePath } from "@/shared/config/appRoutes";
import { roleLabel } from "@/shared/config/roleLabels";
import { useErrorNotice } from "@/shared/hooks/useErrorNotice";
import { ErrorNotice } from "@/shared/ui/feedback/ErrorNotice";
import { useDeactivateMutation } from "../../hooks/useDeactivateMutation";
import { accountCopy } from "../../lib/accountCopy";

const { deactivate: copy } = accountCopy;

/**
 * Pausar a conta do papel atual (REQ-ACC-022 a 025). Explica antes, só libera com "Entendi o que acontece"
 * e envia uma vez. Com sucesso (a mutação já saiu do BFF e limpou o cache), vai para o login com o aviso
 * fixo de conta pausada: a casa pública ainda não existe. Falha mostra a frase e mantém a sessão.
 *
 * @example <DeactivateForm role="host" />
 */
export function DeactivateForm({ role }: { role: PersonalRole }) {
  const router = useRouter();
  const mutation = useDeactivateMutation(role);
  const notice = useErrorNotice();
  const [understood, setUnderstood] = useState(false);

  function handleDeactivate() {
    if (mutation.isPending) return;
    notice.clear();
    mutation.mutate(undefined, {
      onSuccess: () => router.replace(loginNoticePath("conta-pausada", role)),
      onError: notice.report,
    });
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: { xs: 28, md: 34 } }}>
        {copy.title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 3, display: "grid", gap: 1 }}>
        <li>{copy.onlyThis(roleLabel(role))}</li>
        <li>{copy.signOut}</li>
        <li>{copy.comeBack}</li>
      </Box>
      <ErrorNotice message={notice.message} tone={notice.tone} />
      <FormControlLabel
        control={<Checkbox checked={understood} onChange={(event) => setUnderstood(event.target.checked)} />}
        label={copy.understood}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
        <Button
          variant="contained"
          size="large"
          disabled={!understood || mutation.isPending || notice.blocked}
          aria-busy={mutation.isPending}
          onClick={handleDeactivate}
        >
          {mutation.isPending ? copy.submitting : copy.submit}
        </Button>
        <Button component={NextLink} href={homeOf(role)} variant="text" size="large">
          {copy.notNow}
        </Button>
      </Stack>
    </Stack>
  );
}
