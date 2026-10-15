import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/shared/api/query/queryClient";
import { adminOwnerQueries } from "@/features/owners";
import { adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { AccountDetail } from "./AccountDetail";

const accountId = "0199d2a0-0000-7000-8000-000000004201";
const owner = adminOwnerFixture();
const client = getQueryClient({ isServer: false });
client.setQueryData(adminOwnerQueries.detail(accountId, owner.id).queryKey, owner);
const meta = {
  title: "Admin/Accounts/Detail",
  component: AccountDetail,
  decorators: [
    (Story) => (
      <QueryClientProvider client={client}>
        <Story />
      </QueryClientProvider>
    ),
  ],
  args: { accountId, resourceId: owner.id, kind: "owners" },
} satisfies Meta<typeof AccountDetail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {};
export const SlotDaTrilha: Story = {
  args: {
    auditTrail: (
      <div aria-label="Registros recentes" role="region">
        <p>1 de 1 registros</p>
        <p>Conta suspensa · Revisão sintética da conta</p>
      </div>
    ),
  },
};
