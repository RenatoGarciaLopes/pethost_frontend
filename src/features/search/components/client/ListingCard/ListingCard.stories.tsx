import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ListingCard } from "./ListingCard";
import { listingFixture, searchQueryFixture } from "@/test/fixtures/search";

const meta = {
  title: "Search/ListingCard",
  component: ListingCard,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { listing: listingFixture(), query: searchQueryFixture(), petCount: 1 },
} satisfies Meta<typeof ListingCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const ComDatas: Story = {
  args: { query: searchQueryFixture({ from: "2026-10-15", to: "2026-10-20" }), petCount: 2 },
};
