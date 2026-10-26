import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Stack, Typography } from "@mui/material";
import { Surface } from "./Surface";

const meta = {
  title: "Quintal/Layout/Surface",
  component: Surface,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: { children: "Uma superfície clara para agrupar conteúdo.", elevation: "sm" },
} satisfies Meta<typeof Surface>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Padrao: Story = {};
export const Interativa: Story = { args: { interactive: true, children: "Abra os detalhes" } };
export const Elevacoes: Story = {
  render: () => (
    <Stack direction="row" spacing={3}>
      {(["sm", "md", "lg"] as const).map((elevation) => (
        <Surface key={elevation} elevation={elevation} sx={{ p: 2 }}>
          <Typography>{elevation}</Typography>
        </Surface>
      ))}
    </Stack>
  ),
};
