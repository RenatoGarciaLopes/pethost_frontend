import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { expect, fn, within } from "storybook/test";
import { ApiError } from "@/shared/api/errors/ApiError";
import { payoutAccountDto } from "@/test/fixtures/payouts";
import { payoutQueries } from "../../../api/queries";
import { stripeAccountSchema } from "../../../api/contracts";
import { toPayoutAccount } from "../../../api/mappers";
import type { PayoutStatus } from "../../../types";
import { HostPayouts } from "./HostPayouts";
function Frame({ status }: { status: PayoutStatus | "unverified" | "unavailable" }) {
  const [client] = useState(() => {
    const queryClient = new QueryClient();
    const options = payoutQueries.account("story-host");
    queryClient.setQueryDefaults(options.queryKey, { enabled: false });
    if (status === "unavailable") {
      const query = queryClient
        .getQueryCache()
        .build(queryClient, { queryKey: options.queryKey, queryFn: async () => null });
      query.setState({
        status: "error",
        fetchStatus: "idle",
        error: new ApiError({ code: "HOST_STRIPE_UNAVAILABLE", status: 503, message: "synthetic" }),
      });
    } else
      queryClient.setQueryData(
        options.queryKey,
        status === "unverified"
          ? null
          : toPayoutAccount(
              stripeAccountSchema.parse(
                payoutAccountDto({
                  status,
                  payoutsEnabled: status === "enabled",
                  disabledReason: status === "restricted" ? "requirements.past_due" : null,
                }),
              ),
            ),
      );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <HostPayouts accountId="story-host" />
    </QueryClientProvider>
  );
}
const meta = {
  title: "Features/HostPayouts/Estados",
  component: Frame,
  tags: ["autodocs"],
  args: { status: "not_started" },
  parameters: { design: { board: "Fluxo-Verificacao", section: "Como você recebe" } },
  beforeEach: () => {
    useRouter.mockReturnValue({ ...getRouter(), refresh: fn(), bfcacheId: "payouts-story" });
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams(""));
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    if (args.status === "unverified")
      await expect(canvas.getByRole("link", { name: "Ver minha verificação" })).toBeVisible();
    else await expect(canvas.getByRole("status")).toBeVisible();
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AntesDeComecar: Story = {};
export const SemVerificacao: Story = { args: { status: "unverified" } };
export const PelaMetade: Story = { args: { status: "in_progress" } };
export const EmAnalise: Story = { args: { status: "under_review" } };
export const FaltaAlgo: Story = { args: { status: "restricted" } };
export const Conectado: Story = { args: { status: "enabled" } };
export const NaoAprovado: Story = { args: { status: "rejected" } };
export const StripeIndisponivel: Story = { args: { status: "unavailable" } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
