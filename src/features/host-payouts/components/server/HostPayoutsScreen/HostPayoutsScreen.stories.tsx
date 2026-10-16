import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
import { fn } from "storybook/test";
import { Container, Stack, Typography } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { payoutQueries } from "../../../api/queries";
import { stripeAccountSchema } from "../../../api/contracts";
import { toPayoutAccount } from "../../../api/mappers";
import { payoutsCopy } from "../../../lib/payoutsCopy";
import { HostPayouts } from "../../client/HostPayouts";
/** Mesma composição visual do RSC, com cache já hidratado e sem executar cookies no navegador. */
function Frame() {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
      payoutQueries.account("screen-story").queryKey,
      toPayoutAccount(stripeAccountSchema.parse(payoutAccountDto({ status: "under_review" }))),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <Container maxWidth="md">
        <Stack spacing={3}>
          <Typography variant="h1">{payoutsCopy.title}</Typography>
          <HostPayouts accountId="screen-story" />
        </Stack>
      </Container>
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/HostPayouts/TelaHidratada",
  component: Frame,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao", section: "Como você recebe" } },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "payouts-screen-story" });
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams(""));
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
