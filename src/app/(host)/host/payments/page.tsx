import type { Metadata } from "next";
import { Suspense } from "react";
import { payoutsCopy } from "@/features/host-payouts";
import { HostPayoutsScreen } from "@/features/host-payouts/index.server";
import { requireRole } from "@/shared/auth/server/requireRole";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";
export const metadata: Metadata = { title: payoutsCopy.pageTitle, robots: { index: false, follow: false } };
/** Cadastro de recebimento do anfitrião, com sessão dinâmica sob Suspense. @example <HostPaymentsPage /> */
export default function HostPaymentsPage() {
  return (
    <Suspense fallback={<SniffLoader />}>
      <HostPaymentsContent />
    </Suspense>
  );
}
async function HostPaymentsContent() {
  const user = await requireRole("host", "/host/payments");
  return <HostPayoutsScreen accountId={user.id} />;
}
