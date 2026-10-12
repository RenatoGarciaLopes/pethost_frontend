import { Button } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ErrorState } from "./ErrorState";

const meta = {
  title: "Quintal/Feedback/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  parameters: { design: { board: "spec 004 / error.tsx" } },
  args: { onRetry: fn() },
} satisfies Meta<typeof ErrorState>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Erro genérico com "Tentar de novo". */
export const Default: Story = { name: "REQ-DS-014 Erro genérico" };

/** Erro 500 com o código para o suporte. */
export const ComCodigo: Story = { name: "REQ-DS-014 Erro com código", args: { traceId: "0HN7A1B2C3:00000001" } };

/** Sem repetir, com ação de volta. */
export const ComVolta: Story = {
  name: "REQ-DS-014 Erro com volta",
  args: {
    onRetry: undefined,
    title: "Não deu pra abrir essa página.",
    secondaryAction: <Button variant="quiet">Voltar para o início</Button>,
  },
};
