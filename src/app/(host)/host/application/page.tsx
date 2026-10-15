import { Container, Stack, Typography } from "@mui/material";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { verificationCopy } from "@/features/host-applications";
import { ApplicationStatusScreen } from "@/features/host-applications/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
import { HostOnboardingPanel } from "@/widgets/host-onboarding/index.server";

export const metadata: Metadata = {
  title: verificationCopy.pageTitles.status,
  robots: { index: false, follow: false },
};

/** `/host/application` (spec 030): o caminho de três etapas e "Minha verificação", só para anfitrião. */
export default function ApplicationStatusPage() {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={4}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {verificationCopy.status.heading}
        </Typography>
        <Suspense fallback={<SniffLoader label={verificationCopy.loading} />}>
          <ApplicationStatusContent />
        </Suspense>
      </Stack>
    </Container>
  );
}

async function ApplicationStatusContent() {
  // Espera a requisição antes de ler a sessão: o prerender não pode tocar o relógio dela.
  await connection();
  const user = await requireRole("host", "/host/application");
  return (
    <Stack spacing={4}>
      <HostOnboardingPanel accountId={user.id} />
      <ApplicationStatusScreen accountId={user.id} />
    </Stack>
  );
}
