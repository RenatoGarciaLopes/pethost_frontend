import { Container } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchPetDetail } from "../api/server/petDetail.server";
import { PetEditor } from "./client/PetEditor";
import { PetProfile } from "./client/PetProfile";

interface PetScreenProps {
  accountId: string;
  petId: string;
}

/**
 * `/pets/{petId}` no servidor (spec 022): busca a ficha antes de responder e entrega o cache hidratado, sem
 * loader no primeiro acesso. Pet de outra conta ou inexistente vira o 404 da casca (REQ-PEDIT-002).
 *
 * @example <PetProfileScreen accountId={user.id} petId={petId} />
 */
export async function PetProfileScreen({ accountId, petId }: PetScreenProps) {
  const queryClient = getQueryClient();
  await prefetchPetDetail(queryClient, accountId, petId);
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 6 } }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PetProfile accountId={accountId} petId={petId} />
      </HydrationBoundary>
    </Container>
  );
}

/**
 * `/pets/{petId}/edit` no servidor (spec 022): o mesmo prefetch da ficha, para a edição abrir pronta.
 * @example <PetEditScreen accountId={user.id} petId={petId} />
 */
export async function PetEditScreen({ accountId, petId }: PetScreenProps) {
  const queryClient = getQueryClient();
  await prefetchPetDetail(queryClient, accountId, petId);
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PetEditor accountId={accountId} petId={petId} />
      </HydrationBoundary>
    </Container>
  );
}
