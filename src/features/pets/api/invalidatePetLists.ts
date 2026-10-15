import type { QueryClient } from "@tanstack/react-query";
import { petQueries } from "./queries";
import type { PetDto } from "./contracts";
/** Atualiza lista e vitrine do perfil correto. A resposta cobre ficha aberta sem cache da lista. @example await invalidatePetLists(client, accountId, dto); */
export async function invalidatePetLists(
  client: QueryClient,
  accountId: string,
  pet?: Pick<PetDto, "hostId" | "keeper">,
): Promise<void> {
  // Captura antes do refetch, que pode mudar/remover o keeper.
  const hostId =
    pet?.hostId ??
    (pet?.keeper?.type === "host" ? pet.keeper.id : undefined) ??
    client.getQueryData(petQueries.mine(accountId).queryKey)?.hostId;
  await Promise.all([
    client.invalidateQueries({ queryKey: petQueries.mine(accountId).queryKey }),
    ...(hostId ? [client.invalidateQueries({ queryKey: petQueries.house(hostId).queryKey })] : []),
  ]);
}
