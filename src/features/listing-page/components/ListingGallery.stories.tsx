import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import { listingPhotosFixture, listingPhotoFixture } from "@/test/fixtures/listingPage";
import { ListingGallery } from "./ListingGallery";

const meta = {
  title: "Listing page/Galeria",
  component: ListingGallery,
  args: {
    title: "Casa da Cida",
    photos: [
      ...listingPhotosFixture,
      { id: "4", position: 4, url: listingPhotoFixture("#F1D9C0") },
      { id: "5", position: 5, url: listingPhotoFixture("#D2EFC0") },
    ],
    neighbor: true,
  },
} satisfies Meta<typeof ListingGallery>;
export default meta;
type Story = StoryObj<typeof meta>;

/** As cinco fotos ficam acessíveis, mesmo com três molduras no computador. */
export const CincoFotos: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    const all = body.queryByRole("button", { name: "Ver as 5 fotos" });
    const opener = all ?? body.getByRole("button", { name: "Ver a foto 1 de 5 de Casa da Cida" });
    await userEvent.click(opener);
    await userEvent.keyboard("{ArrowLeft}");
    await expect(body.getByText("5 de 5")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(body.queryByRole("dialog")).not.toBeInTheDocument());
    await expect(opener).toHaveFocus();
  },
};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
export const SemFotos: Story = { args: { photos: [] } };
