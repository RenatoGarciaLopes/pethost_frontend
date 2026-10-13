import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ErrorNotice } from "./ErrorNotice";

const meta = {
  title: "Quintal/Feedback/ErrorNotice",
  component: ErrorNotice,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { tone: "erro", message: "Não deu pra falar com o PetHost agora. Tenta de novo em instantes." },
} satisfies Meta<typeof ErrorNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Erro genérico (rede, desconhecido). */
export const Erro: Story = { name: "REQ-PWD-012 Erro" };

/** Limite de tentativas: tom de atenção, a frase traz a contagem. */
export const Limite: Story = {
  name: "REQ-ACC-028 Limite",
  args: { tone: "atencao", message: "Muitas tentativas. Dá pra tentar de novo em 30 segundos." },
};
