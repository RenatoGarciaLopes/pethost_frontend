import { Button } from "@mui/material";
import NextLink from "next/link";
import { Notice } from "@/shared/ui/feedback/Notice";
import { countWaitingRequests } from "../api/server/bookings.server";
import { bookingCopy } from "../lib/bookingCopy";
import { hostBookingsPath } from "../lib/bookingPaths";

const copy = bookingCopy.host;

/**
 * O aviso do painel com os pedidos esperando resposta (REQ-HREQ-001). Sem pedidos, nada.
 * @example <WaitingRequestsNotice count={2} />
 */
export function WaitingRequestsNotice({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Notice
      tone="info"
      title={copy.waiting(count)}
      action={
        <Button component={NextLink} href={hostBookingsPath("pedidos")} size="small" variant="outlined">
          {copy.seeRequests}
        </Button>
      }
    />
  );
}

/**
 * Os pedidos esperando resposta no painel `/host`, lidos no servidor (REQ-HREQ-001).
 * @example <WaitingRequestsSummary accountId={user.id} />
 */
export async function WaitingRequestsSummary({ accountId }: { accountId: string }) {
  return <WaitingRequestsNotice count={await countWaitingRequests(accountId)} />;
}
