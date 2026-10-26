import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, within } from "storybook/test";
import { withQueryClient } from "@/test/storybook/withQueryClient";
import { NearbyListings } from "./NearbyListings";

const meta = {
  title: "Home/Perto de você",
  component: NearbyListings,
  tags: ["autodocs"],
  parameters: { design: { board: "Quintal-Casas" }, layout: "fullscreen" },
  args: { scope: "visitor" },
  decorators: [withQueryClient],
} satisfies Meta<typeof NearbyListings>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Antes do gesto: só o convite e o botão; a posição nunca é pedida sozinha sem permissão prévia. */
export const AntesDoGesto: Story = {
  name: "REQ-NEARBY-010 Antes do gesto",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const title = canvas.getByRole("heading", { name: "Casas com vaga perto de você" });
    const button = canvas.getByRole("button", { name: "Usar minha localização" });
    const card = title.closest("[data-surface]")!;
    const cardRect = card.getBoundingClientRect();
    const buttonRect = button.getBoundingClientRect();
    await expect(getComputedStyle(title).textAlign).toBe("center");
    await expect(Math.abs(buttonRect.left + buttonRect.width / 2 - cardRect.left - cardRect.width / 2)).toBeLessThan(2);
    const body = canvas.getByText(/Deixe o navegador dizer onde você está/);
    const bodyRect = body.getBoundingClientRect();
    await expect(Math.abs(bodyRect.left + bodyRect.width / 2 - cardRect.left - cardRect.width / 2)).toBeLessThan(2);
  },
};
export const AntesDoGestoCelular: Story = {
  ...AntesDoGesto,
  name: "Convite centralizado no celular",
  globals: { viewport: { value: "celular", isRotated: false } },
};
