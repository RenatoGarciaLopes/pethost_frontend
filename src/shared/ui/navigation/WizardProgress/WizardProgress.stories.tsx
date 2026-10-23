import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { WizardProgress } from "./WizardProgress";

const petSteps = [
  { id: "bicho", label: "Que bicho é?" },
  { id: "nome", label: "Nome e fotos" },
  { id: "corpo", label: "Corpo" },
  { id: "saude", label: "Saúde" },
  { id: "rotina", label: "Rotina" },
  { id: "convivencia", label: "Convivência" },
  { id: "revisao", label: "Revisão" },
];

const meta = {
  title: "Quintal/Navigation/WizardProgress",
  component: WizardProgress,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: { steps: petSteps, currentIndex: 2, variant: "trail" },
} satisfies Meta<typeof WizardProgress>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Trilha vertical (computador), no passo 3 de 7. */
export const Trilha: Story = { name: "REQ-DS-012 Trilha" };

/** Anel "n/total" com o próximo passo (celular). */
export const Anel: Story = { name: "REQ-DS-012 Anel", args: { variant: "ring" } };

/** Cadastro em 2 passos, no último. */
export const UltimoPasso: Story = {
  name: "REQ-DS-012 Último passo",
  args: {
    steps: [
      { id: "voce", label: "Você" },
      { id: "endereco", label: "Onde você mora" },
    ],
    currentIndex: 1,
  },
};

export const Cadastro: Story = {
  args: {
    appearance: "cards",
    currentIndex: 0,
    steps: [
      { id: "person", label: "Você", description: "Nome, contato e CPF" },
      { id: "address", label: "Onde você mora", description: "Pra achar cantinhos perto" },
      { id: "pet", label: "Seu pet", description: "Depois, com calma" },
    ],
  },
};
