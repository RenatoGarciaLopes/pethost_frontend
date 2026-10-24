import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { MessageComposer } from "./MessageComposer";

const meta = {
  title: "Features/Conversations/MessageComposer",
  component: MessageComposer,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: { recipientName: "Dona Cida", onSend: fn() },
  decorators: [(Story) => <main>{Story()}</main>],
} satisfies Meta<typeof MessageComposer>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "REQ-CHAT-008 Pronto para escrever" };
export const Enviando: Story = { name: "REQ-CHAT-008 Enviando", args: { isSending: true } };
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
