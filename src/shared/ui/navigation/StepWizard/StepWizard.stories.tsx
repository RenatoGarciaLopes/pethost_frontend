import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { waitForEntrance } from "@/test/waitForEntrance";
import { Typography } from "@mui/material";
import { StepWizard, StepWizardActions } from "./StepWizard";

const steps = [
  { id: "person", label: "Você", description: "Nome, contato e CPF" },
  { id: "address", label: "Onde você mora", description: "Pra achar cantinhos perto" },
  { id: "pet", label: "Seu pet", description: "Depois, com calma" },
];

const meta = {
  title: "Quintal/Navigation/StepWizard",
  component: StepWizard,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", design: { board: "Fluxo-Cadastro" } },
  play: waitForEntrance,
  args: {
    steps,
    currentIndex: 0,
    progressTitle: "Criar conta",
    progressLabel: "Etapas do cadastro",
    position: "Passo 1 de 3",
    title: "Bora se conhecer.",
    intro: "Conta rapidinho quem você é.",
    children: (
      <>
        <Typography>Os campos do passo entram aqui.</Typography>
        <StepWizardActions backLabel="Voltar" nextLabel="Continuar: onde você mora" onBack={fn()} onNext={fn()} />
      </>
    ),
  },
} satisfies Meta<typeof StepWizard>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Primeiro passo, com a frase de apoio. No celular a trilha vira o anel "n/total". */
export const PrimeiroPasso: Story = { name: "REQ-DS-012 Primeiro passo" };

/** Último passo, com aviso acima do conteúdo e linha de rodapé. */
export const UltimoPassoComAviso: Story = {
  name: "REQ-DS-012 Último passo com aviso",
  args: {
    currentIndex: 1,
    position: "Passo 2 de 3",
    title: "Onde você mora",
    intro: undefined,
    notice: <Typography role="alert">Esse e-mail já tem conta.</Typography>,
    footer: <Typography>Já tem conta? Entrar</Typography>,
  },
};
