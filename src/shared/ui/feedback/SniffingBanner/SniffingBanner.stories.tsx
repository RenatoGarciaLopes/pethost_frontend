import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SniffingBanner } from "./SniffingBanner";

const meta = {
  title: "Shared/SniffingBanner",
  component: SniffingBanner,
  parameters: { design: { board: "Busca-Mapa" } },
} satisfies Meta<typeof SniffingBanner>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Compacto: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
};
