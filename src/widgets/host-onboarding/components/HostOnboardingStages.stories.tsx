import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HostOnboardingStages } from "./HostOnboardingStages";

const meta = {
  title: "Widgets/HostOnboarding/HostOnboardingStages",
  component: HostOnboardingStages,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  args: { verificationApproved: false },
} satisfies Meta<typeof HostOnboardingStages>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Antes da aprovação: só a verificação liberada. */
export const AntesDaAprovacao: Story = { name: "REQ-HVER-001 Antes da aprovação" };

/** Verificação aprovada: a etapa 2 é liberada. */
export const Aprovada: Story = { name: "REQ-HVER-016 Aprovada", args: { verificationApproved: true } };

/** Celular: uma etapa por linha. */
export const Celular: Story = {
  name: "REQ-HVER-001 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
