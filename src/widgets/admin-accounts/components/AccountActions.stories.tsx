import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { toAccountRow } from "../lib/accountRows";
import { AccountActions } from "./AccountActions";

const meta = {
  title: "Admin/Accounts/Actions",
  component: AccountActions,
  args: { row: toAccountRow({ kind: "owners", value: adminOwnerFixture() }), busy: false, onAction: () => {} },
} satisfies Meta<typeof AccountActions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Ativa: Story = {};
export const Suspensa: Story = {
  args: { row: toAccountRow({ kind: "owners", value: adminOwnerFixture({ suspendedAt: "2026-10-01T12:00:00Z" }) }) },
};
export const IdentidadeLiberada: Story = {
  args: {
    row: toAccountRow({ kind: "hosts", value: adminHostFixture({ identityReleasedAt: "2026-10-12T12:00:00Z" }) }),
  },
};
export const StripeRecusado: Story = {
  args: { row: toAccountRow({ kind: "hosts", value: adminHostFixture({ stripeStatus: "rejected" }) }) },
};
