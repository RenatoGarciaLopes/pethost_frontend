import { Link, Stack, Typography } from "@mui/material";
import NextLink from "next/link";
import { petsCopy } from "../../../lib/petsCopy";
/** A 030 só deve habilitar o link depois de entregar a rota. @example <KeeperPendingNotice verificationAvailable /> */
export interface KeeperPendingNoticeProps {
  verificationAvailable?: boolean;
}
/** Bloqueio informativo antes da ficha, sem papel de alerta dinâmico. Pode ser composto no servidor. @example <KeeperPendingNotice /> */
export function KeeperPendingNotice({ verificationAvailable = false }: KeeperPendingNoticeProps) {
  return (
    <Stack spacing={2} sx={{ py: 2 }}>
      <Typography>{petsCopy.keeperPending}</Typography>
      {verificationAvailable && (
        <Link component={NextLink} href="/host/application" sx={{ alignSelf: "flex-start", py: 1 }}>
          {petsCopy.verification}
        </Link>
      )}
    </Stack>
  );
}
