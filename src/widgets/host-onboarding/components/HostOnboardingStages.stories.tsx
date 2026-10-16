import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HostOnboardingStages } from "./HostOnboardingStages";

const meta = {
  title: "Widgets/HostOnboarding/HostOnboardingStages",
  component: HostOnboardingStages,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  parameters: { design: { board: "Fluxo-Cantinho" } },
  args: { progress: { verified: false, payouts: null, hasListing: false } },
} satisfies Meta<typeof HostOnboardingStages>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Antes da aprovação: só a verificação liberada. */
export const AntesDaAprovacao: Story = { name: "REQ-HVER-001 Antes da aprovação" };

/** Aprovada, recebimento em análise no Stripe. */
export const RecebimentoEmAnalise: Story = {
  name: "REQ-LIST-001 Recebimento em análise",
  args: { progress: { verified: true, payouts: { enabled: false, status: "under_review" }, hasListing: false } },
};

/** Recebimento liberado: hora de montar o cantinho. */
export const MontarCantinho: Story = {
  name: "REQ-LIST-001 Montar o cantinho",
  args: { progress: { verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: false } },
};

/** Tudo pronto. */
export const CantinhoAberto: Story = {
  name: "REQ-LIST-001 Cantinho aberto",
  args: { progress: { verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: true } },
};

/** Celular: uma etapa por linha. */
export const Celular: Story = {
  name: "REQ-LIST-001 Celular",
  args: { progress: { verified: true, payouts: { enabled: true, status: "enabled" }, hasListing: false } },
  globals: { viewport: { value: "celular", isRotated: false } },
};
