import type { Metadata } from "next";
import { Suspense } from "react";
import { accountCopy } from "@/features/account";
import { ProfileScreen } from "@/features/account/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = {
  title: accountCopy.profile.pageTitle,
  robots: { index: false, follow: false },
};

/** `/users/profile` (spec 015, REQ-ACC-002 a 017): o perfil do papel atual, já hidratado. */
export default function ProfilePage() {
  return (
    <Suspense fallback={<SniffLoader />}>
      <ProfileContent />
    </Suspense>
  );
}

async function ProfileContent() {
  const user = await requirePersonalUser("/users/profile");
  return <ProfileScreen userId={user.id} role={user.role} />;
}
