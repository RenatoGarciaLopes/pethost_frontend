import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { KeeperPendingNotice } from "./KeeperPendingNotice";
const meta = {
  title: "Features/Pets/KeeperPendingNotice",
  component: KeeperPendingNotice,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho", section: "Pets da casa" } },
} satisfies Meta<typeof KeeperPendingNotice>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const VerificacaoDisponivel: Story = { args: { verificationAvailable: true } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
