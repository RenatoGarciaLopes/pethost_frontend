import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { adminApplicationFixture } from "@/test/fixtures/adminApplications";
import { ApplicationQueueView } from "./ApplicationQueue";
const meta = {
  title: "Admin/VerificationQueue",
  component: ApplicationQueueView,
  parameters: { design: { board: "Fluxo-Admin", label: "Fila" } },
  args: { rows: [adminApplicationFixture()], status: "submitted", page: 1, onChange: () => {} },
} satisfies Meta<typeof ApplicationQueueView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const EmAnalise: Story = {};
export const Vazia: Story = { args: { rows: [] } };
export const Celular: Story = { globals: { viewport: { value: "celular" } } };
export const MaisDe25: Story = {
  args: {
    rows: Array.from({ length: 26 }, (_, index) =>
      adminApplicationFixture({ id: `0199d2a0-0000-7000-8000-${String(index).padStart(12, "0")}` }),
    ),
  },
};
