import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Container, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { petDto, petKeeperDto } from "@/test/fixtures/pets";
import { myPetsSchema } from "../api/contracts";
import { toPetList } from "../api/mappers";
import { petQueries } from "../api/queries";
import { petsCopy } from "../lib/petsCopy";
import { PetList } from "./client/PetList";
import { KeeperPendingNotice } from "./client/KeeperPendingNotice";
function Frame({ empty = false, pending = false }: { empty?: boolean; pending?: boolean }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      petQueries.mine("storybook-host").queryKey,
      toPetList(
        myPetsSchema.parse({
          keeper: { ...petKeeperDto, type: "host" },
          pets: empty ? [] : [petDto({ name: "Bóris" })],
        }),
      ),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <FlashMessageProvider>
        <Container maxWidth="lg">
          <Stack spacing={3}>
            <Typography variant="h1">{petsCopy.host.title}</Typography>
            {pending ? <KeeperPendingNotice /> : <PetList accountId="storybook-host" role="host" />}
          </Stack>
        </Container>
      </FlashMessageProvider>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/Pets/MyPetsScreen",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho", section: "Pets da casa" } },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Anfitriao: Story = {};
export const SemPets: Story = { args: { empty: true } };
export const AguardandoVerificacao: Story = { args: { pending: true } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
