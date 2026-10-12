import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { TrustList } from "./TrustList";

const meta = {
  title: "Data display/TrustList",
  component: TrustList,
  args: { items: ["Conversa antes de fechar", "Foto todo dia", "Pagamento guardado"] },
} satisfies Meta<typeof TrustList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Como aparece ao lado do formulário de entrar (computador). */
export const Padrao: Story = {};
