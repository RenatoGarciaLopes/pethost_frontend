import { Button, Stack, Typography } from "@mui/material";
import { Notice } from "@/shared/ui/feedback/Notice";
import { bookingCopy } from "../lib/bookingCopy";

const copy = bookingCopy.request;
/** Troca de conta (spec 014). */
const SWITCH_ACCOUNT_PATH = "/users/switch";

/**
 * Anfitrião em `/listings/{id}/request` (REQ-REQST-001): em vez do 403, o recado de que pedir é com a conta de tutor e
 * o caminho da troca de conta. Componente de servidor: o botão leva só `href` (o tema faz dele um link do Next).
 *
 * @example user.role === "host" ? <RequestStayHostNotice /> : <RequestStayForm … />
 */
export function RequestStayHostNotice() {
  return (
    <Stack spacing={3}>
      <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
        {copy.heading}
      </Typography>
      <Notice
        tone="info"
        title={copy.hostAccount}
        action={
          <Button href={SWITCH_ACCOUNT_PATH} variant="outlined" size="small">
            {copy.switchAccount}
          </Button>
        }
      />
    </Stack>
  );
}
