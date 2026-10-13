import type { Metadata } from "next";
import { Suspense } from "react";
import { accountCopy } from "@/features/account";
import { PasswordChangeForm } from "@/features/account/index.client";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: accountCopy.password.pageTitle,
  robots: { index: false, follow: false },
};

/** `/users/password` (spec 015, REQ-ACC-018 a 021). O papel marca o link de esqueci a senha. */
export default function PasswordPage() {
  return (
    <Suspense fallback={<SniffLoader />}>
      <PasswordContent />
    </Suspense>
  );
}

async function PasswordContent() {
  const user = await requirePersonalUser("/users/password");
  return <PasswordChangeForm role={user.role} />;
}
