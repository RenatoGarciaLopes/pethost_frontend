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

/** REQ-UIC-002: três caixas da faixa de confiança da home; celular empilha sem recortar texto. */
export const Caixas: Story = {
  args: {
    variant: "cards",
    items: [
      { title: "Conversa antes de fechar", description: "Pergunte tudo sobre a casa e a rotina.", icon: "chat" },
      { title: "Foto do seu pet todo dia", description: "As notícias chegam pelo chat.", icon: "camera" },
      {
        title: "Pagamento guardado",
        description: "O anfitrião só recebe depois que seu pet volta pra casa.",
        icon: "lock",
      },
    ],
  },
};
