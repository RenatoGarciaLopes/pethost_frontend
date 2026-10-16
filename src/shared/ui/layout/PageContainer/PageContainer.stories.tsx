import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Typography } from "@mui/material";
import { PageContainer } from "./PageContainer";

const meta = {
  title: "Quintal/Layout/PageContainer",
  component: PageContainer,
  tags: ["autodocs"],
  parameters: { a11y: { test: "error" } },
  args: { children: <Typography>Conteúdo organizado com largura de página.</Typography> },
} satisfies Meta<typeof PageContainer>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Page: Story = { args: { width: "page" } };
export const Reading: Story = { args: { width: "reading" } };
