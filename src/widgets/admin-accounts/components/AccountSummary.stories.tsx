import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { adminHostFixture, adminOwnerFixture } from "@/test/fixtures/adminAccounts";
import { AccountSummary } from "./AccountSummary";

const meta = {
  title: "Admin/Accounts/Summary",
  component: AccountSummary,
  args: { source: { kind: "owners", value: adminOwnerFixture() } },
} satisfies Meta<typeof AccountSummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {};
export const AnfitriaoPessoaFisica: Story = { args: { source: { kind: "hosts", value: adminHostFixture() } } };
export const AnfitriaEmpresa: Story = {
  args: {
    source: {
      kind: "hosts",
      value: adminHostFixture({
        personType: "pj",
        company: {
          cnpj: "11222333000181",
          legalName: "Hospedagem da Ana Ltda.",
          tradeName: "Quintal da Ana",
          address: { city: "Maringá", state: "PR" },
        },
      }),
    },
  },
};
export const ContaSuspensa: Story = {
  args: { source: { kind: "owners", value: adminOwnerFixture({ suspendedAt: "2026-10-01T12:00:00Z" }) } },
};
