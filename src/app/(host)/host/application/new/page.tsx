import type { Metadata } from "next";
import { Suspense } from "react";
import { verificationCopy } from "@/features/host-applications";
import { ApplicationWizardScreen } from "@/features/host-applications/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: verificationCopy.pageTitles.start,
  robots: { index: false, follow: false },
};

/** `/host/application/new` (spec 030): o assistente desde "Antes de começar"; com rascunho, vai para as fotos. */
export default function NewApplicationPage() {
  return (
    <Suspense fallback={<SniffLoader label={verificationCopy.loading} />}>
      <NewApplicationContent />
    </Suspense>
  );
}

async function NewApplicationContent() {
  const user = await requireRole("host", "/host/application/new");
  return <ApplicationWizardScreen accountId={user.id} entry="start" />;
}
