import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusTimeline } from "./StatusTimeline";

const meta = {
  title: "Quintal/DataDisplay/StatusTimeline",
  component: StatusTimeline,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  args: {
    label: "Andamento da verificação",
    steps: [
      { id: "sent", label: "Enviado", state: "done" },
      { id: "review", label: "Em análise", state: "current" },
      { id: "approved", label: "Aprovado", state: "todo" },
    ],
  },
} satisfies Meta<typeof StatusTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Em análise: a etapa do meio é a de agora. */
export const EmAnalise: Story = { name: "REQ-HVER-012 Em análise" };

/** Tudo feito. */
export const Concluida: Story = {
  name: "REQ-HVER-016 Concluída",
  args: {
    steps: [
      { id: "sent", label: "Enviado", state: "done" },
      { id: "review", label: "Em análise", state: "done" },
      { id: "approved", label: "Aprovado", state: "done" },
    ],
  },
};

/** Celular: continua em linha, em colunas iguais. */
export const Celular: Story = {
  name: "REQ-HVER-012 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
