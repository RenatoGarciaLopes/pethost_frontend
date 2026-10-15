import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { toAccountRow } from "../lib/accountRows";
import { AccountsDirectoryView } from "./AccountsDirectory";

const owner = toAccountRow({ kind: "owners", value: adminOwnerFixture() });
const company = toAccountRow({
  kind: "hosts",
  value: adminHostFixture({ personType: "pj", stripeStatus: "rejected" }),
});
const meta = {
  title: "Admin/Accounts/Directory",
  component: AccountsDirectoryView,
  args: {
    rows: [owner],
    type: "owners",
    status: "all",
    stripeStatus: "all",
    page: 1,
    search: "",
    onSearchChange: () => {},
    onChange: () => {},
  },
} satisfies Meta<typeof AccountsDirectoryView>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutores: Story = {};
export const Anfitrioes: Story = { args: { rows: [company], type: "hosts" } };
export const SemResultados: Story = { args: { rows: [] } };
