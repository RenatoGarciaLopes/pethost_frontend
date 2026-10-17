import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListingPageActions } from "./ListingPageActions";

const meta = {
  title: "Listing page/Ações",
  component: ListingPageActions,
  args: {
    listingId: "0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c",
    requestHref: "/listings/0199c5a2-7f3e-7a41-9b1c-2d4e6f8a0b1c/request",
    isOwnerView: false,
    accountRole: "owner",
    hasTotal: true,
  },
} satisfies Meta<typeof ListingPageActions>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Tutor: Story = {};
export const AnfitriaoVisitante: Story = { args: { accountRole: "host" } };
export const DonoDoCantinho: Story = { args: { isOwnerView: true, accountRole: "host" } };
