import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { StayBanner } from "./StayBanner";

const meta = {
  title: "Widgets/ConversationPanel/StayBanner",
  component: StayBanner,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Conversas" } },
  args: { status: "Acontecendo", text: "20 a 25 de dez. · Pipoca está na casa de Dona Cida" },
  decorators: [(Story) => <main>{Story()}</main>],
} satisfies Meta<typeof StayBanner>;

// O formato CSF do Storybook exige o meta como export default.
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = { name: "REQ-CHAT-011 Estadia acontecendo" };
export const Celular: Story = {
  name: "REQ-CHAT-012 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
