import type { Metadata } from "next";
import { Suspense } from "react";
import { petQueries, petSpeciesSchema, petWizardCopy } from "@/features/pets";
import { PetWizardScreen, prefetchMyPets } from "@/features/pets/index.server";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
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
  const client = getQueryClient();
  const access = user.role === "host" ? await prefetchMyPets(client, user.id) : { keeperPending: false };
  // Falha transitória não libera um formulário cuja disponibilidade não foi confirmada.
  const error = client.getQueryState(petQueries.mine(user.id).queryKey)?.error;
  if (error && !access.keeperPending) throw error;
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <PetWizardScreen
        accountId={user.id}
        role={user.role}
        keeperPending={access.keeperPending}
        initialSpecies={species.success ? species.data : undefined}
      />
    </HydrationBoundary>
  );
}
