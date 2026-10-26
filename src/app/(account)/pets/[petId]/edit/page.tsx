import { Suspense } from "react";
import { PetProfileSkeleton } from "@/features/pets/index.client";
import { PetEditScreen } from "@/features/pets/index.server";
import { petPageMetadata, requirePetOwner, type PetPageProps } from "../petPage";

const pathOf = (petId: string) => `/pets/${petId}/edit`;

export const generateMetadata = petPageMetadata(pathOf);

/** `/pets/{petId}/edit` (spec 022): a ficha por seções, cada uma com o próprio "Salvar". */
export default function PetEditPage(props: PetPageProps) {
  return (
    <Suspense fallback={<PetProfileSkeleton />}>
      <PetEditContent {...props} />
    </Suspense>
  );
}

async function PetEditContent({ params }: PetPageProps) {
  const { user, petId } = await requirePetOwner(params, pathOf);
  return <PetEditScreen accountId={user.id} petId={petId} />;
}
