import type { Metadata } from "next";
import { Suspense } from "react";
import { petsCopy } from "@/features/pets";
import { PetListSkeleton } from "@/features/pets/index.client";
import { MyPetsScreen } from "@/features/pets/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";

/** Título acompanha o papel da sessão. @example await generateMetadata() */
export async function generateMetadata(): Promise<Metadata> {
  const user = await requirePersonalUser("/pets");
  return { title: `${petsCopy[user.role].title} · PetHost`, robots: { index: false, follow: false } };
}

/** `/pets` (spec 020): tutor ou anfitrião (REQ-PETS-010); admin vai para a casa dele. */
export default function MyPetsPage() {
  return (
    <Suspense fallback={<PetListSkeleton />}>
      <MyPetsContent />
    </Suspense>
  );
}

async function MyPetsContent() {
  const user = await requirePersonalUser("/pets");
  return <MyPetsScreen accountId={user.id} role={user.role} />;
}
