import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, within } from "storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { myApplicationSchema } from "../../../api/contracts";
import { myApplicationQueries } from "../../../api/queries";
import { toMyApplication } from "../../../api/toMyApplication";
import { ApplicationStatusView } from "./ApplicationStatusView";

const ACCOUNT = "storybook-host";

interface FrameProps {
  mine: Record<string, unknown>;
}

/** Cache semeado com a verificação (staleTime infinito: nenhuma story chama a API) e providers reais. */
function Frame({ mine }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(
      myApplicationQueries.mine(ACCOUNT).queryKey,
      toMyApplication(myApplicationSchema.parse(mine)),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <FlashMessageProvider>
        <main>
          <ApplicationStatusView accountId={ACCOUNT} />
        </main>
      </FlashMessageProvider>
    </QueryClientProvider>
  );
}

const withApplication = (application: Record<string, unknown>, overrides: Record<string, unknown> = {}) =>
  myApplicationDto({ application: hostApplicationDto({ missingDocuments: [], ...application }), ...overrides });

const meta = {
  title: "Features/HostApplications/ApplicationStatusView",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Verificacao" } },
  args: { mine: myApplicationDto() },
  beforeEach: () => {
    // Mock/decorator do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

export const SemSolicitacao: Story = { name: "REQ-HVER-002 Sem solicitação" };
export const PelaMetade: Story = {
  name: "REQ-HVER-011 Rascunho",
  args: { mine: withApplication({ status: "draft", missingDocuments: ["back", "selfie"] }) },
};
export const EmAnalise: Story = {
  name: "REQ-HVER-012 Em análise",
  args: { mine: withApplication({ status: "submitted" }, { canStartNew: false }) },
};
export const Recusada: Story = {
  name: "REQ-HVER-014 Recusada",
  args: {
    mine: withApplication({ status: "rejected", rejectionReason: "selfie_mismatch" }, { remainingAttempts: 2 }),
  },
};
export const SoSuporte: Story = {
  name: "REQ-HVER-015 Só pelo suporte",
  args: { mine: withApplication({ status: "rejected_final", rejectionReason: "other" }, { canStartNew: false }) },
};
export const Aprovada: Story = {
  name: "REQ-HVER-016 Aprovada",
  args: { mine: withApplication({ status: "approved" }, { canStartNew: false }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = await canvas.findByRole("heading", { name: "Verificação aprovada!" });
    await expect(getComputedStyle(title).textAlign).toBe("center");
    await expect(getComputedStyle(canvas.getByText("Agora é só dizer como você quer receber.")).textAlign).toBe(
      "center",
    );
  },
};
export const Vencida: Story = { name: "REQ-HVER-017 Vencida", args: { mine: withApplication({ status: "expired" }) } };
export const Desistencia: Story = {
  name: "REQ-HVER-017 Desistência",
  args: { mine: withApplication({ status: "cancelled" }) },
};
export const Celular: Story = {
  name: "REQ-HVER-014 Celular",
  args: { mine: withApplication({ status: "rejected", rejectionReason: "document_illegible" }) },
  globals: { viewport: { value: "celular", isRotated: false } },
};
