import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReasonActionDialog } from "./ReasonActionDialog";
const meta = {
  title: "Shared/ReasonActionDialog",
  component: ReasonActionDialog,
  parameters: { design: { reference: "Padrão administrativo da 031, sem board próprio" } },
  args: {
    open: true,
    title: "Suspender conta",
    effect: "A pessoa sai da conta e não entra até retirar a suspensão.",
    confirmLabel: "Suspender",
    cancelLabel: "Cancelar",
    reasonLabel: "Motivo",
    onConfirm: () => {},
    onCancel: () => {},
  },
} satisfies Meta<typeof ReasonActionDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Motivo: Story = {};
export const Irreversivel: Story = {
  args: {
    title: "Liberar CPF",
    effect: "Essa conta não volta.",
    confirmLabel: "Liberar CPF",
    confirmationWord: "LIBERAR",
    confirmationLabel: "Digite LIBERAR",
  },
};
export const Confirmacao: Story = {
  args: {
    mode: "confirmation",
    title: "Tirar suspensão",
    effect: "A pessoa recebe um e-mail e volta ao status anterior.",
  },
};
export const Salvando: Story = { args: { busy: true } };
export const Erro: Story = { args: { error: "Só dá para liberar depois de suspender a conta." } };
