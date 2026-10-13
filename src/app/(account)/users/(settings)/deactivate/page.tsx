import type { Metadata } from "next";
import { Suspense } from "react";
import { accountCopy } from "@/features/account";
import { DeactivateForm } from "@/features/account/index.client";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: accountCopy.deactivate.pageTitle,
  robots: { index: false, follow: false },
};

/** `/users/deactivate` (spec 015, REQ-ACC-022 a 025): pausa só a conta do papel atual. */
export default function DeactivatePage() {
  return (
    <Suspense fallback={<SniffLoader />}>
      <DeactivateContent />
    </Suspense>
  );
}

async function DeactivateContent() {
  const user = await requirePersonalUser("/users/deactivate");
  return <DeactivateForm role={user.role} />;
}
