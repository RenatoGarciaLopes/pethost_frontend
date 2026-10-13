import { Box, Stack, Typography } from "@mui/material";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { roleLabel } from "@/shared/config/roleLabels";
import { switchCopy } from "../../lib/switchCopy";

export interface AccountPairProps {
  current: PersonalRole;
  target: PersonalRole;
}

/**
 * Conta atual e conta de destino (REQ-SWITCH-002), cada uma no tom do cabeçalho dela
 * (`theme.palette.account`). A diferença é dita em texto; a cor só ajuda.
 *
 * @example <AccountPair current="owner" target="host" />
 */
export function AccountPair({ current, target }: AccountPairProps) {
  return (
    <Stack spacing={1}>
      <AccountRow role={current} text={switchCopy.current(roleLabel(current))} />
      <Typography aria-hidden sx={{ textAlign: "center", color: "text.secondary", lineHeight: 1 }}>
        ↓
      </Typography>
      <AccountRow role={target} text={switchCopy.target(roleLabel(target))} strong />
    </Stack>
  );
}

function AccountRow({ role, text, strong = false }: { role: PersonalRole; text: string; strong?: boolean }) {
  return (
    <Box
      sx={{
        bgcolor: `account.${role}`,
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        px: 2,
        py: 1.5,
      }}
    >
      <Typography sx={{ fontWeight: strong ? 700 : 400 }}>{text}</Typography>
    </Box>
  );
}
