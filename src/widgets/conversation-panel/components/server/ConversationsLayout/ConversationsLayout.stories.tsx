import { Box } from "@mui/material";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { ConversationList } from "@/features/conversations/index.client";
import { previewConversations } from "@/test/conversationsPreview";
import { ConversationLoading } from "../../client/ConversationsShell";
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
  args: {
    list: (
      <ConversationList conversations={previewConversations()} viewer="owner" hrefOf={(id) => `/conversations/${id}`} />
    ),
    panel: slot("Conversa aberta"),
    focus: "panel",
  },
  decorators: [(Story) => <main>{Story()}</main>],
} satisfies Meta<typeof ConversationsLayout>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Computador: Story = { name: "Lista e conversa lado a lado" };
export const CarregandoConversa: Story = {
  name: "Carregamento apenas no painel",
  args: { panel: <ConversationLoading /> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const sidebar = canvas.getByRole("region", { name: "Suas conversas" });
    const loading = canvas.getByRole("status");
    await expect(sidebar).toBeVisible();
    await expect(loading).toHaveTextContent("Abrindo a conversa");
    await expect(getComputedStyle(loading.parentElement!).backgroundColor).toBe(
      getComputedStyle(sidebar).backgroundColor,
    );
    await expect(loading.getBoundingClientRect().left).toBeGreaterThan(sidebar.getBoundingClientRect().right);
  },
};
export const SemConversaAberta: Story = {
  name: "Nenhuma conversa aberta",
  args: { panel: undefined, focus: "list" },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole("region", { name: "Escolha uma conversa" });
    const heading = canvas.getByRole("heading", { name: "Escolha uma conversa" });
    const panelRect = panel.getBoundingClientRect();
    const headingRect = heading.getBoundingClientRect();
    await expect(panel).toBeVisible();
    await expect(
      Math.abs(headingRect.left + headingRect.width / 2 - panelRect.left - panelRect.width / 2),
    ).toBeLessThan(2);
    await expect(headingRect.top).toBeGreaterThan(panelRect.top + panelRect.height / 3);
  },
};
export const CelularConversa: Story = {
  name: "REQ-CHAT-012 Celular: só a conversa",
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("Suas conversas").closest("section")).not.toBeVisible();
    await expect(canvas.getByText("Conversa aberta")).toBeVisible();
  },
};
export const CelularLista: Story = {
  name: "REQ-CHAT-012 Celular: só a lista",
  args: { focus: "list", panel: undefined },
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Suas conversas" })).toBeVisible();
    await expect(canvas.getByText("Escolha uma conversa").closest("section")).not.toBeVisible();
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
