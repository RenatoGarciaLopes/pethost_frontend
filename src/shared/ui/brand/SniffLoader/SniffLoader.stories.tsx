import { Box } from "@mui/material";
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

/** No cartão de resultados da home: ocupa o cartão e fica no centro, sem precisar de `sx` no consumidor. */
export const NoCartao: Story = {
  name: "REQ-DS-016 Centralizado no cartão",
  args: { label: "Procurando cantinhos" },
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <Box sx={{ width: { xs: "100%", sm: 640 }, height: 300, border: "2px solid", borderRadius: 3 }}>{Story()}</Box>
    ),
  ],
};

/** Com `prefers-reduced-motion`, tudo parado e o cachorro fica à vista, na frente da porta. */
export const MovimentoReduzido: Story = {
  name: "REQ-DS-016 Movimento reduzido",
  beforeEach: () => {
    const original = window.matchMedia;
    window.matchMedia = (query: string) =>
      ({
        matches: query.includes("reduce"),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as MediaQueryList;
    return () => {
      window.matchMedia = original;
    };
  },
};
