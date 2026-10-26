import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Box } from "@mui/material";
import { expect, within } from "storybook/test";
import { StatusTimeline } from "./StatusTimeline";

const meta = {
  title: "Quintal/DataDisplay/StatusTimeline",
  component: StatusTimeline,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Verificacao" } },
  args: {
    label: "Andamento da verificação",
    steps: [
      { id: "sent", label: "Enviado", state: "done" },
      { id: "review", label: "Em análise", state: "current" },
      { id: "approved", label: "Aprovado", state: "todo" },
    ],
  },
} satisfies Meta<typeof StatusTimeline>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Em análise: a etapa do meio é a de agora. */
export const EmAnalise: Story = { name: "REQ-HVER-012 Em análise" };

/** Tudo feito. */
export const Concluida: Story = {
  name: "REQ-HVER-016 Concluída",
  args: {
    steps: [
      { id: "sent", label: "Enviado", state: "done" },
      { id: "review", label: "Em análise", state: "done" },
      { id: "approved", label: "Aprovado", state: "done" },
    ],
  },
};

/** Celular: continua em linha, em colunas iguais. */
export const Celular: Story = {
  name: "REQ-HVER-012 Celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};

/** Quatro marcos continuam lado a lado mesmo na largura útil do celular. */
export const EstadiaNoCelular: Story = {
  name: "REQ-TL-004 Estadia horizontal no celular",
  render: (args) => (
    <Box sx={{ width: 340, maxWidth: "100%" }}>
      <StatusTimeline {...args} />
    </Box>
  ),
  args: {
    label: "Andamento da estadia",
    steps: [
      { id: "pedido", label: "Pedido", state: "done", detail: "10 de dez., 9h" },
      { id: "confirmada", label: "Confirmada", state: "done", detail: "11 de dez., 14h30" },
      { id: "chegou", label: "Chegou", state: "current", detail: "20 de dez., 12h" },
      { id: "voltou", label: "Voltou pra casa", state: "todo", detail: "sex., 25 de dez." },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole("list", { name: "Andamento da estadia" });
    const items = within(list).getAllByRole("listitem");
    const boxes = items.map((item) => item.getBoundingClientRect());
    await expect(items).toHaveLength(4);
    await expect(items[2]).toHaveAttribute("aria-current", "step");
    await expect(list.scrollWidth).toBeLessThanOrEqual(list.clientWidth + 1);
    for (const box of boxes) {
      await expect(Math.abs(box.top - boxes[0].top)).toBeLessThan(1);
      await expect(Math.abs(box.width - boxes[0].width)).toBeLessThan(1);
    }
    await expect(boxes[3].left).toBeGreaterThan(boxes[0].right);
  },
};

/** Cancelamento conserva o que aconteceu e encerra a trilha, sem prometer marcos futuros. */
export const Cancelada: Story = {
  args: {
    label: "Andamento da estadia cancelada",
    steps: [
      { id: "pedido", label: "Pedido", state: "done", detail: "10 de dez., 9h" },
      { id: "cancelada", label: "Cancelada", state: "stopped" },
    ],
  },
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole("list", { name: "Andamento da estadia cancelada" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    await expect(within(list).getByText("parou")).toBeVisible();
    await expect(list.querySelector("[aria-current]")).toBeNull();
    await expect(within(list).queryByRole("button")).toBeNull();
  },
};
