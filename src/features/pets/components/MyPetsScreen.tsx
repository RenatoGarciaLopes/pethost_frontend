import { Container, Stack, Typography } from "@mui/material";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { prefetchMyPets } from "../api/server/myPets.server";
import { petsCopy } from "../lib/petsCopy";
import { PetList } from "./client/PetList";
import type { PersonalRole } from "@/shared/auth/contracts/session";
import { KeeperPendingNotice } from "./client/KeeperPendingNotice";

/**
 * `/pets` no servidor (spec 020): busca os pets antes de responder e entrega o cache hidratado à lista,
 * que abre pronta, sem loader no primeiro acesso (REQ-PETS-006). Fica dentro do `<main>` da casca.
 *
 * @example <MyPetsScreen accountId={user.id} />
 */
export async function MyPetsScreen({ accountId, role = "owner" }: { accountId: string; role?: PersonalRole }) {
  const queryClient = getQueryClient();
  const { keeperPending } = await prefetchMyPets(queryClient, accountId);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Typography variant="h1" sx={{ fontSize: { xs: 30, md: 40 } }}>
          {petsCopy[role].title}
        </Typography>
        <HydrationBoundary state={dehydrate(queryClient)}>
          {role === "host" && keeperPending ? <KeeperPendingNotice /> : <PetList accountId={accountId} role={role} />}
        </HydrationBoundary>
      </Stack>
    </Container>
  );
}
