import type { Metadata } from "next";
import { Suspense } from "react";
import { petSpeciesSchema, petWizardCopy } from "@/features/pets";
import { PetWizardScreen } from "@/features/pets/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";
import { firstParam, type SearchParams } from "@/shared/lib/url/searchParams";
import { SniffLoader } from "@/shared/ui/brand/SniffLoader";

export const metadata: Metadata = { title: petWizardCopy.pageTitle, robots: { index: false, follow: false } };

interface NewPetPageProps {
  searchParams: Promise<SearchParams>;
}

/**
 * `/pets/new` (spec 021): tutor ou anfitrião. `?species=` válido já marca o bicho (REQ-PNEW-002); valor
 * desconhecido é ignorado.
 */
export default function NewPetPage(props: NewPetPageProps) {
  return (
    <Suspense fallback={<SniffLoader />}>
      <NewPetContent {...props} />
    </Suspense>
  );
}

async function NewPetContent({ searchParams }: NewPetPageProps) {
  const user = await requirePersonalUser("/pets/new");
  const species = petSpeciesSchema.safeParse(firstParam((await searchParams).species));
  return <PetWizardScreen accountId={user.id} initialSpecies={species.success ? species.data : undefined} />;
}
