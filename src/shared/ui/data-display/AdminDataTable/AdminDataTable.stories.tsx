import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { AdminDataTable } from "./AdminDataTable";
const meta = {
  title: "shared/ui/data-display/AdminDataTable",
  component: AdminDataTable<string>,
  parameters: { design: { board: "Fluxo-Admin" } },
  args: {
    label: "Fila",
    rows: ["Pessoa A", "Pessoa B"],
    columns: [
      {
        key: "name",
        label: "Nome",
        render: (row: string) => row,
        compare: (a: string, b: string) => a.localeCompare(b),
      },
    ],
    rowKey: (row: string) => row,
    rowHref: () => "/admin/host-applications",
    rowLabel: (row: string) => row,
    page: 1,
    onPageChange: () => {},
    empty: "Ninguém esperando agora",
  },
} satisfies Meta<typeof AdminDataTable<string>>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Vazia: Story = { args: { rows: [] } };
export const Celular: Story = { globals: { viewport: { value: "celular" } } };
