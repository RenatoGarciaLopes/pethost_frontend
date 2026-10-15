import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { listingDto, myListingsDto } from "@/test/fixtures/listings";
import { myListingsSchema } from "../api/contracts";
import { toMyListings } from "../api/mappers";
import { ListingSummaryList } from "./ListingSummaryList";

const cover = {
  id: "0199e0a0-0000-7000-8000-0000000000f1",
  position: 1,
  url: `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90"><rect width="120" height="90" fill="#8EC5E8"/></svg>`,
  )}`,
};
const mine = (listings: unknown[], isCompany = false) =>
  toMyListings(myListingsSchema.parse(myListingsDto(listings, { isCompany })));

const meta = {
  title: "Features/HostListings/ListingSummaryList",
  component: ListingSummaryList,
  tags: ["autodocs"],
  parameters: { design: { board: "Fluxo-Cantinho" } },
  args: { mine: mine([listingDto({ photos: [cover] })]) },
} satisfies Meta<typeof ListingSummaryList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const UmCantinho: Story = { name: "REQ-LIST-001 Um cantinho" };
export const Empresa: Story = {
  name: "REQ-LIST-001 Empresa com filiais",
  args: {
    mine: mine(
      [
        listingDto({ photos: [cover], title: "Pet Feliz Centro" }),
        listingDto({ id: "0199e0a0-0000-7000-8000-0000000000c2", title: "Pet Feliz Zona 7", isActive: false }),
      ],
      true,
    ),
  },
};
