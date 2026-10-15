import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPetId, petEditCopy } from "@/features/pets";
import { getPetDetail } from "@/features/pets/index.server";
import { requirePersonalUser } from "@/shared/auth/server/requirePersonalUser";

/** Rotas de um pet: o `petId` vem da URL. */
export interface PetPageProps {
  params: Promise<{ petId: string }>;
}

const NOINDEX = { index: false, follow: false } as const;

/**
 * Dono do pet logado e o id já conferido (UUID inválido vira 404 sem chamar a API). Tutor ou anfitrião; admin
 * vai para a casa dele (REQ-PEDIT-016).
 *
 * @example const { user, petId } = await requirePetOwner(params, (id) => `/pets/${id}`);
 */
export async function requirePetOwner(params: PetPageProps["params"], pathOf: (petId: string) => string) {
  const { petId } = await params;
  if (!isPetId(petId)) notFound();
  const user = await requirePersonalUser(pathOf(petId));
  return { user, petId };
}

/**
 * Título "{nome} · Meus pets", da mesma busca da página (`getPetDetail` usa `cache()`).
 * @example export const generateMetadata = petPageMetadata((id) => `/pets/${id}`);
 */
export function petPageMetadata(pathOf: (petId: string) => string) {
  return async ({ params }: PetPageProps): Promise<Metadata> => {
    const { user, petId } = await requirePetOwner(params, pathOf);
    const pet = await getPetDetail(user.id, petId);
    return { title: petEditCopy.pageTitle(pet.values.name), robots: NOINDEX };
  };
}
