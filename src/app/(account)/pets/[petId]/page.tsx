import { Suspense } from "react";
import { PetProfileSkeleton } from "@/features/pets/index.client";
import { PetProfileScreen } from "@/features/pets/index.server";
import { petPageMetadata, requirePetOwner, type PetPageProps } from "./petPage";

const pathOf = (petId: string) => `/pets/${petId}`;

export const generateMetadata = petPageMetadata(pathOf);

/** `/pets/{petId}` (spec 022): a ficha do pet, só para o dono. */
export default function PetProfilePage(props: PetPageProps) {
  return (
    <Suspense fallback={<PetProfileSkeleton />}>
      <PetProfileContent {...props} />
    </Suspense>
  );
}

async function PetProfileContent({ params }: PetPageProps) {
  const { user, petId } = await requirePetOwner(params, pathOf);
  return <PetProfileScreen accountId={user.id} petId={petId} />;
}
