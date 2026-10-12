import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { SniffLoader } from "./SniffLoader";

const meta = {
  title: "Quintal/Brand/SniffLoader",
  component: SniffLoader,
  tags: ["autodocs"],
  parameters: { design: { board: "Loading-Caes" }, layout: "centered" },
} satisfies Meta<typeof SniffLoader>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Padrão: "Farejando…". */
export const Default: Story = { name: "REQ-DS-016 Farejando" };

/** Texto da busca. */
export const Busca: Story = { name: "REQ-DS-016 Procurando cantinhos", args: { label: "Procurando cantinhos" } };

/** Menor, para dentro de cartões. */
export const Pequeno: Story = { name: "REQ-DS-016 Pequeno", args: { scale: 1 } };
