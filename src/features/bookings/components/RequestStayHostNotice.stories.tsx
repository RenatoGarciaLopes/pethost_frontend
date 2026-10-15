import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RequestStayHostNotice } from "./RequestStayHostNotice";

const meta = {
  title: "Features/Bookings/RequestStayHostNotice",
  component: RequestStayHostNotice,
  tags: ["autodocs"],
  parameters: { layout: "padded", design: { board: "Fluxo-Reserva" } },
  decorators: [
    (Story) => (
      <main>
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof RequestStayHostNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const ContaDeAnfitriao: Story = { name: "REQ-REQST-001 Conta de anfitrião" };
