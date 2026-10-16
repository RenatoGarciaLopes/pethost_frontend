import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { AuditFilters } from "./AuditFilters";

const meta = {
  title: "Features/AdminAudit/Filtros",
  component: AuditFilters,
  args: { filters: { page: 1, pageSize: 20 }, invalidFields: [], onApply: fn(), onClear: fn() },
  parameters: { design: { board: "Admin-Auditoria", section: "Filtros compartilháveis" } },
} satisfies Meta<typeof AuditFilters>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SemFiltros: Story = {};
export const IntervaloInvalido: Story = {
  args: { filters: { page: 1, pageSize: 20, from: "2026-10-16", to: "2026-10-15" } },
};
