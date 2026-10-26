import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { navItemsFor } from "@/shared/config/navigation";
import { HeaderNav } from "./HeaderNav";

const meta = {
  title: "Widgets/AppShell/HeaderNav",
  component: HeaderNav,
  args: { items: navItemsFor("owner"), stayUpdates: false },
  parameters: { layout: "padded" },
} satisfies Meta<typeof HeaderNav>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Seen: Story = {};
export const Updates: Story = {
  args: { stayUpdates: true },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole("link", { name: "Minhas estadias (há novidades)" })).toBeVisible();
  },
};
export const MobileUpdates: Story = {
  args: { stayUpdates: true },
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Abrir a navegação (há novidades)" }));
    const body = within(canvasElement.ownerDocument.body);
    await expect(body.getByRole("link", { name: "Minhas estadias (há novidades)" })).toBeVisible();
    await expect(body.getByRole("button", { name: "Fechar menu" })).toBeVisible();
  },
};
