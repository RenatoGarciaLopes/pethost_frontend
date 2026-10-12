import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Hint } from "./Hint";

const meta = {
  title: "Quintal/Feedback/Hint",
  component: Hint,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Conta" } },
  args: { children: "Pra mostrar cantinhos perto de você e pro pagamento." },
} satisfies Meta<typeof Hint>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Dica simples. */
export const Default: Story = { name: "REQ-DS-014 Dica" };

/** Com título. */
export const ComTitulo: Story = {
  name: "REQ-DS-014 Dica com título",
  args: { title: "Por que pedimos o endereço?" },
};

/** Sem ícone, para listas densas. */
export const SemIcone: Story = { name: "REQ-DS-014 Dica sem ícone", args: { icon: false } };
