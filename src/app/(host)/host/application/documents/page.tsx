import type { Metadata } from "next";
import { Suspense } from "react";
import { verificationCopy } from "@/features/host-applications";
import { ApplicationWizardScreen } from "@/features/host-applications/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: verificationCopy.pageTitles.documents,
  robots: { index: false, follow: false },
};

/** `/host/application/documents` (spec 030): fotos e "Confere e envia" do rascunho; sem rascunho, volta ao status. */
export default function ApplicationDocumentsPage() {
  return (
    <Suspense fallback={<SniffLoader label={verificationCopy.loading} />}>
      <ApplicationDocumentsContent />
    </Suspense>
  );
}

async function ApplicationDocumentsContent() {
  const user = await requireRole("host", "/host/application/documents");
  return <ApplicationWizardScreen accountId={user.id} entry="documents" />;
}
