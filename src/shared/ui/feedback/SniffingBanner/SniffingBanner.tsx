"use client";
import { Stack, Typography } from "@mui/material";
import { TurmaWalker } from "@/shared/ui/brand/TurmaWalker";

/** Faixa não bloqueante; corgi atravessa uma vez, estático com movimento reduzido. @example <SniffingBanner /> */
export function SniffingBanner() {
  return (
    <Stack role="status" direction="row" spacing={2} sx={{ py: 1, alignItems: "center" }}>
      <Typography>Farejando cantinhos…</Typography>
      <TurmaWalker members={["corgi"]} dogHeight={42} crossingMs={2000} repeat="once" />
    </Stack>
  );
}
