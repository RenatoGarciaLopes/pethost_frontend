import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { auditEntryFixture } from "@/test/fixtures/audit";
import { toAuditEntry } from "../../../api/mappers";
import { AuditEntryDetail } from "./AuditEntryDetail";

const meta = {
  title: "Features/AdminAudit/Detalhe",
  component: AuditEntryDetail,
  args: { entry: toAuditEntry(auditEntryFixture()), onClose: () => {} },
  parameters: { design: { board: "Admin-Auditoria", section: "Detalhe do registro" } },
} satisfies Meta<typeof AuditEntryDetail>;
export default meta;
type Story = StoryObj<typeof meta>;
export const RegistroConhecido: Story = {};
export const AcaoDesconhecida: Story = {
  args: { entry: toAuditEntry(auditEntryFixture({ action: "future_module.changed" })) },
};
