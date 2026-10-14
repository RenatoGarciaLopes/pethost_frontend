"use client";

import { Box, Button, Link, Stack } from "@mui/material";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { homeOf, loginRedirectPath, registerPath } from "@/shared/config/appRoutes";
import { roleLabel } from "@/shared/config/roleLabels";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { useAnnounce } from "@/shared/ui/feedback/Announcer";
import { EmptyState } from "@/shared/ui/feedback/EmptyState";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Notice } from "@/shared/ui/feedback/Notice";
import { useLinkedAccounts } from "../../hooks/useLinkedAccounts";
import { switchAvailability } from "../../lib/switchAvailability";
import { switchCopy } from "../../lib/switchCopy";
import { AccountPair } from "./AccountPair";
import { StepHeading } from "@/shared/ui/navigation/StepHeading";
import { SwitchPasswordForm } from "./SwitchPasswordForm";

export interface AccountSwitchPanelProps {
  /** Dono do cache das contas vinculadas (`accountQueryKey`). */
  userId: string;
  current: PersonalRole;
  /** Já resolvido pela página (`resolveSwitchTarget`): sempre a outra conta. */
  target: PersonalRole;
}

/**
 * `/users/switch` (spec 014): lê as contas da mesma pessoa (já hidratadas pela página) e mostra a troca,
 * o convite para criar a outra conta (REQ-SWITCH-003) ou o aviso de conta pausada. Depois da troca, a
 * casa da conta nova com `replace` + `refresh` e o anúncio na região viva do app (REQ-SWITCH-006).
 *
 * @example <AccountSwitchPanel userId={user.id} current="owner" target="host" />
 */
export function AccountSwitchPanel({ userId, current, target }: AccountSwitchPanelProps) {
  const router = useRouter();
  const announce = useAnnounce();
  // Depois da troca o cache foi limpo e a página está saindo: a lista não é buscada de novo.
  const [leaving, setLeaving] = useState(false);
  const accounts = useLinkedAccounts(userId, { enabled: !leaving });
  const account = roleLabel(target);

  function handleSwitched() {
    setLeaving(true);
    router.replace(homeOf(target));
    router.refresh();
    announce(switchCopy.done(account));
  }

  return (
    <Stack spacing={3}>
      <StepHeading>{switchCopy.title}</StepHeading>
      {leaving || accounts.isPending ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 3 }}>
          <SniffLoader label={leaving ? switchCopy.submitting : switchCopy.loading} scale={1} />
        </Box>
      ) : accounts.isError ? (
        <ErrorState title={switchCopy.loadError} onRetry={() => void accounts.refetch()} />
      ) : (
        {
          available: (
            <>
              <AccountPair current={current} target={target} />
              <SwitchPasswordForm current={current} target={target} onSwitched={handleSwitched} />
            </>
          ),
          missing: (
            <EmptyState
              title={switchCopy.missing(account)}
              action={
                <Button component={NextLink} href={registerPath(target)} variant="contained">
                  {switchCopy.create(account)}
                </Button>
              }
            />
          ),
          paused: (
            <Notice
              tone="atencao"
              action={
                <Link component={NextLink} href={loginRedirectPath(null, target)}>
                  {switchCopy.reactivate}
                </Link>
              }
            >
              {switchCopy.paused(account)}
            </Notice>
          ),
        }[switchAvailability(accounts.data, target)]
      )}
    </Stack>
  );
}
