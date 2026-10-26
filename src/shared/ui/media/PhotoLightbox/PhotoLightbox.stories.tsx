import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@mui/material";
import { expect, userEvent, within, waitFor, fn } from "storybook/test";
import { listingPhotosFixture } from "@/test/fixtures/listingPage";
import { PhotoLightbox } from "./PhotoLightbox";

const meta = {
  title: "Quintal/Media/PhotoLightbox",
  component: PhotoLightbox,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { photos: listingPhotosFixture, title: "Casa da Cida", initialIndex: 0, open: true, onClose: fn() },
} satisfies Meta<typeof PhotoLightbox>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Dimensões extremas reproduzem o recorte causado pelo tamanho intrínseco no grid. */
export const ProporcoesOriginais: Story = {
  args: {
    photos: [
      [1600, 900],
      [600, 1600],
      [1200, 1200],
    ].map(([width, height], index) => ({
      id: `proportion-${index}`,
      url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#7FC4E0"/><rect x="4" y="4" width="${width - 8}" height="${height - 8}" fill="none" stroke="#1F1A17" stroke-width="8"/><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 3}" fill="#FFC93C"/></svg>`)}`,
    })),
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    for (let index = 0; index < 3; index++) {
      const image = body.getByRole("img", { name: `Foto ${index + 1} de Casa da Cida` }) as HTMLImageElement;
      await waitFor(() => expect(image.naturalWidth).toBeGreaterThan(0));
      const stage = body.getByTestId("photo-stage").getBoundingClientRect();
      const box = image.getBoundingClientRect();
      await expect(getComputedStyle(image).objectFit).toBe("contain");
      await expect(Math.abs(box.height - stage.height)).toBeLessThan(1);
      await expect(Math.abs(box.width - stage.width)).toBeLessThan(1);
      await expect(stage.bottom).toBeLessThanOrEqual(window.innerHeight);
      await expect(stage.height).toBeGreaterThan(100);
      await userEvent.click(body.getByRole("button", { name: "Próxima foto" }));
    }
  },
};

export const ProporcoesOriginaisCelular: Story = {
  ...ProporcoesOriginais,
  globals: { viewport: { value: "celular", isRotated: false } },
};

/** Abertura, foco preso, zoom, navegação e retorno de foco no Chromium real. */
export const Navegacao: Story = {
  render: function Exemplo(args) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir fotos</Button>
        {open && <PhotoLightbox {...args} open onClose={() => setOpen(false)} />}
      </>
    );
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const opener = body.getByRole("button", { name: "Abrir fotos" });
    await userEvent.click(opener);
    const dialog = body.getByRole("dialog");
    await userEvent.click(body.getByRole("button", { name: "Aumentar zoom" }));
    await expect(body.getByRole("img", { name: "Foto 1 de Casa da Cida" })).toHaveStyle({
      transform: "matrix(1.5, 0, 0, 1.5, 0, 0)",
    });
    await userEvent.keyboard("{ArrowRight}");
    await expect(body.getByText("2 de 3")).toBeVisible();
    await expect(body.getByRole("img", { name: "Foto 2 de Casa da Cida" })).toHaveStyle({
      transform: "matrix(1, 0, 0, 1, 0, 0)",
    });
    await userEvent.keyboard("{Tab}");
    await expect(dialog).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement);
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener).toHaveFocus();
  },
};

/** Pinça, arraste limitado, toque duplo e swipe com PointerEvents no navegador.
 * O Chromium não captura IDs sintéticos; só setPointerCapture é neutralizado durante o play.
 * A matemática e os handlers de produção são exercitados sem substituição.
 */
export const Gestos: Story = {
  globals: { viewport: { value: "celular", isRotated: false } },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const stage = body.getByTestId("photo-stage");
    const capture = stage.setPointerCapture;
    stage.setPointerCapture = () => {};
    const pointer = (type: string, pointerId: number, x: number, y: number) =>
      stage.dispatchEvent(
        new PointerEvent(type, { bubbles: true, pointerId, pointerType: "touch", clientX: x, clientY: y, button: 0 }),
      );
    const photo = () => body.getByRole("img", { name: /^Foto/ });
    try {
      await waitFor(() => expect((photo() as HTMLImageElement).naturalWidth).toBeGreaterThan(0));
      pointer("pointerdown", 1, 100, 200);
      pointer("pointerdown", 2, 200, 200);
      pointer("pointermove", 2, 300, 200);
      await waitFor(() => expect(photo()).toHaveStyle({ transform: "matrix(2, 0, 0, 2, 0, 0)" }));
      pointer("pointerup", 2, 300, 200);
      pointer("pointerup", 1, 100, 200);
      pointer("pointerdown", 1, 100, 200);
      pointer("pointermove", 1, 2000, 2000);
      pointer("pointerup", 1, 2000, 2000);
      await waitFor(() => expect(new DOMMatrix(getComputedStyle(photo()).transform).e).not.toBe(0));
      const translation = new DOMMatrix(getComputedStyle(photo()).transform);
      await expect(Math.abs(translation.e)).toBeLessThanOrEqual(stage.clientWidth / 2 + 1);
      await expect(Math.abs(translation.f)).toBeLessThanOrEqual(stage.clientHeight / 2 + 1);
      await userEvent.click(body.getByRole("button", { name: "Voltar ao tamanho" }));
      pointer("pointerdown", 1, 200, 200);
      pointer("pointerup", 1, 200, 200);
      pointer("pointerdown", 1, 200, 200);
      pointer("pointerup", 1, 200, 200);
      await waitFor(() => expect(photo()).toHaveStyle({ transform: "matrix(2, 0, 0, 2, 0, 0)" }));
      await userEvent.click(body.getByRole("button", { name: "Voltar ao tamanho" }));
      pointer("pointerdown", 1, 250, 200);
      pointer("pointermove", 1, 100, 200);
      pointer("pointerup", 1, 100, 200);
      await waitFor(() => expect(body.getByText("2 de 3")).toBeVisible());
      await expect(canvasElement.ownerDocument.documentElement.scrollWidth).toBeLessThanOrEqual(
        canvasElement.ownerDocument.documentElement.clientWidth,
      );
    } finally {
      stage.setPointerCapture = capture;
    }
  },
};

/** Uma foto mantém zoom e fechamento sem setas de navegação. */
export const UmaFoto: Story = { args: { photos: listingPhotosFixture.slice(0, 1) } };
