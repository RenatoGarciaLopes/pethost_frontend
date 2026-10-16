import { Container, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { WaitingRequestsSummary } from "@/features/bookings/index.server";
import { listingCopy } from "@/features/host-listings";
import { MyListingsSummary } from "@/features/host-listings/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { HostOnboardingPanel } from "@/widgets/host-onboarding/index.server";

export const metadata: Metadata = { title: listingCopy.pageTitles.panel, robots: { index: false, follow: false } };

/** `/host` (specs 044 e 053): o painel do anfitrião, com os pedidos esperando resposta, as três etapas e os cantinhos. */
export default function HostHomePage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={4}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {listingCopy.panelHeading}
        </Typography>
        <Suspense fallback={<SniffLoader label={listingCopy.loading} />}>
          <HostHomeContent />
        </Suspense>
      </Stack>
    </Container>
  );
}

async function HostHomeContent() {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("host", "/host");
  return (
    <Stack spacing={5}>
      <WaitingRequestsSummary accountId={user.id} />
      <HostOnboardingPanel accountId={user.id} />
      <MyListingsSummary accountId={user.id} />
    </Stack>
  );
}
