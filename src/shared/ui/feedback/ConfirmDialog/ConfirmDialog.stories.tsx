import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { ConfirmDialog } from "./ConfirmDialog";

const meta = {
  title: "Quintal/Feedback/ConfirmDialog",
  component: ConfirmDialog,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Pet" } },
  args: {
    open: true,
    title: "Tirar Thor da lista?",
    message: "A ficha de Thor sai da sua lista. As estadias antigas continuam no histórico.",
    confirmLabel: "Tirar da lista",
    cancelLabel: "Deixar como está",
    onConfirm: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConfirmDialog>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Pergunta neutra; o foco começa em "Deixar como está". */
export const Padrao: Story = { name: "REQ-PEDIT-011 Tirar da lista" };

/** Confirmação em andamento: nada fecha. */
export const Ocupado: Story = { name: "REQ-PEDIT-011 Ocupado", args: { busy: true } };

/** Erro da confirmação mostrado dentro do diálogo. */
export const ComErro: Story = {
  name: "REQ-PEDIT-013 Erro",
  args: { error: "Não deu pra falar com o PetHost agora. Tenta de novo em instantes." },
};

/** Sair de uma seção com alteração não salva. */
export const SairSemSalvar: Story = {
  name: "REQ-PEDIT-017 Sair sem salvar",
  args: {
    title: "Sair sem salvar?",
    message: "O que você mudou aqui ainda não foi salvo.",
    confirmLabel: "Sair sem salvar",
    cancelLabel: "Continuar editando",
  },
};

/** Celular: botões quebram linha sem cortar o texto. */
export const Celular: Story = {
  name: "REQ-PEDIT-011 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
