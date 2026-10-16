import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box, Typography } from "@mui/material";
import { fn } from "storybook/test";
import { FlowActions } from "../FlowActions";
import { FlowProgress } from "@/shared/ui/navigation/FlowProgress";
import { FlowLayout } from "./FlowLayout";

const steps = [
  { id: "account", label: "Conta", description: "Seus dados de acesso" },
  { id: "pet", label: "Corpo", description: "Conte sobre o pet" },
  { id: "photos", label: "Fotos", description: "Escolha as imagens" },
];
const meta = {
  title: "Quintal/Layout/FlowLayout",
  component: FlowLayout,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: {
    progress: <FlowProgress steps={steps} current="pet" completed={["account"]} />,
    step: (
      <Box>
        <Typography variant="h2">Conte sobre o seu pet</Typography>
        <Typography>Campos do passo atual.</Typography>
      </Box>
    ),
    preview: (
      <Box sx={{ border: "2px dashed", p: 2 }}>
        <Typography>Prévia da ficha</Typography>
      </Box>
    ),
    actions: <FlowActions onBack={fn()} onContinue={fn()} />,
  },
} satisfies Meta<typeof FlowLayout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TresFaixas: Story = {};
export const SemPrevia: Story = { args: { preview: undefined } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
