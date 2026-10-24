import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ConversationsLayout } from "./ConversationsLayout";

/** Caixas no lugar da lista e da conversa: mostra só a distribuição da página. */
const slot = (label: string) => (
  <Box sx={{ p: 2, border: "2px dashed", borderColor: "quintal.linha", height: "100%" }}>{label}</Box>
);

const meta = {
  title: "Widgets/ConversationPanel/ConversationsLayout",
  component: ConversationsLayout,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen", design: { board: "Fluxo-Conversas" } },
  args: { list: slot("Lista de conversas"), panel: slot("Conversa aberta"), focus: "panel" },
  decorators: [(Story) => <main>{Story()}</main>],
} satisfies Meta<typeof ConversationsLayout>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Computador: Story = { name: "Lista e conversa lado a lado" };
export const SemConversaAberta: Story = { name: "Nenhuma conversa aberta", args: { panel: undefined, focus: "list" } };
export const CelularConversa: Story = {
  name: "REQ-CHAT-012 Celular: só a conversa",
  globals: { viewport: { value: "celular", isRotated: false } },
};
export const CelularLista: Story = {
  name: "REQ-CHAT-012 Celular: só a lista",
  args: { focus: "list" },
  globals: { viewport: { value: "celular", isRotated: false } },
};
