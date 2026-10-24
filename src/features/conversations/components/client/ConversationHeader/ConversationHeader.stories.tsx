import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StatusPill } from "@/shared/ui/feedback/StatusPill";
import { ConversationHeader } from "./ConversationHeader";

const meta = {
  title: "Features/Conversations/ConversationHeader",
  component: ConversationHeader,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: {
    name: "Dona Cida",
    avatarUrl: "/brand/turma/golden.webp",
    subtitle: "Casa da Dona Cida · Jd. Alvorada",
    backHref: "/conversations",
  },
  decorators: [(Story) => <main>{Story()}</main>],
} satisfies Meta<typeof ConversationHeader>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "Com o cantinho" };
export const ComSelo: Story = {
  name: "REQ-CHAT-011 Com o dia da estadia",
  args: { aside: <StatusPill tone="info" label="Pipoca aqui · dia 2 de 5" /> },
};
export const SemFoto: Story = { name: "Sem foto nem cantinho", args: { avatarUrl: null, subtitle: undefined } };
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular, com voltar",
  globals: { viewport: { value: "celular", isRotated: false } },
};
