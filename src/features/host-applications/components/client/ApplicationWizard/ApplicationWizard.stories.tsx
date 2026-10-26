import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useRouter } from "@storybook/nextjs-vite/navigation.mock";
import { getRouter } from "@storybook/nextjs-vite/router.mock";
import { expect, fn, userEvent, within } from "storybook/test";
import { waitForEntrance } from "@/test/waitForEntrance";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { FlashMessageProvider } from "@/shared/hooks/useFlashMessage";
import { allDocumentsDto, companyDto, hostApplicationDto, myApplicationDto } from "@/test/fixtures/hostApplication";
import { myApplicationSchema } from "../../../api/contracts";
import { myApplicationQueries } from "../../../api/queries";
import { toMyApplication } from "../../../api/toMyApplication";
import { verificationCopy as copy } from "../../../lib/verificationCopy";
import type { WizardEntry } from "../../../types";
import { ApplicationWizard } from "./ApplicationWizard";

const ACCOUNT = "storybook-host";

interface FrameProps {
  entry: WizardEntry;
  application: Record<string, unknown> | null;
}

/** Cache semeado com a verificação (staleTime infinito: nenhuma story chama a API) e providers reais. */
function Frame({ entry, application }: FrameProps) {
  const [client] = useState(() => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { staleTime: Infinity, retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(
      myApplicationQueries.mine(ACCOUNT).queryKey,
      toMyApplication(myApplicationSchema.parse(myApplicationDto({ application }))),
    );
    return queryClient;
  });
  return (
    <QueryClientProvider client={client}>
      <FlashMessageProvider>
        <main>
          <ApplicationWizard accountId={ACCOUNT} entry={entry} />
        </main>
      </FlashMessageProvider>
    </QueryClientProvider>
  );
}

const meta = {
  title: "Features/HostApplications/ApplicationWizard",
  component: Frame,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Verificacao" } },
  play: waitForEntrance,
  args: { entry: "start", application: null },
  beforeEach: () => {
    // Mock/decorator do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useRouter.mockReturnValue({ ...getRouter(), push: fn(), refresh: fn(), bfcacheId: "story" });
  },
} satisfies Meta<typeof Frame>;
export default meta;
type Story = StoryObj<typeof meta>;

/** O aviso das fotos antes de tudo, a escolha Pessoa física / Empresa e o "Li e concordo". */
export const AntesDeComecar: Story = {
  name: "REQ-HVER-003 Antes de começar",
  play: async ({ canvasElement }) => {
    const heading = await within(canvasElement).findByRole("heading", { level: 1, name: copy.notice.heading });
    await waitForEntrance({ canvasElement });
    await expect(heading).toBeVisible();
  },
};

/** "Seus dados" da pessoa física: CPF e o documento em três cartões. */
export const SeusDados: Story = {
  name: "REQ-HVER-004 Seus dados",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(await canvas.findByRole("checkbox", { name: copy.notice.accept }));
    await userEvent.click(canvas.getByRole("button", { name: copy.notice.next }));
    await expect(await canvas.findByRole("heading", { level: 1, name: copy.data.heading })).toBeVisible();
    await waitForEntrance({ canvasElement });
  },
};

/** Volta outro dia: o rascunho de empresa abre direto nas fotos. */
export const Fotos: Story = {
  name: "REQ-HVER-006 Fotos",
  args: { entry: "documents", application: hostApplicationDto({ personType: "pj", company: companyDto }) },
};

/** Fotos já enviadas: abre em "Confere e envia". */
export const Confere: Story = {
  name: "REQ-HVER-010 Confere e envia",
  args: { entry: "documents", application: hostApplicationDto({ documents: allDocumentsDto, missingDocuments: [] }) },
};

/** Celular (390 px): anel de progresso e uma vaga por linha. */
export const Celular: Story = {
  name: "REQ-HVER-006 Celular",
  args: { entry: "documents", application: hostApplicationDto() },
  globals: { viewport: { value: "celular", isRotated: false } },
};
