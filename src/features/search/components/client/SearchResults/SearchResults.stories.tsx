import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchResults } from "./SearchResults";
import { listingFixture, searchQueryFixture } from "@/test/fixtures/search";
import { expect, fn, userEvent, within } from "storybook/test";

const meta = {
  title: "Search/SearchResults",
  component: SearchResults,
  parameters: { design: { board: "Busca-Mapa" } },
  args: {
    query: searchQueryFixture(),
    items: [listingFixture()],
    totalCount: 1,
    petCount: 1,
    onMore: () => {},
    onRetry: () => {},
    onExpand: fn(),
  },
} satisfies Meta<typeof SearchResults>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Vazio: Story = {
  args: { items: [], totalCount: 0 },
  play: async ({ canvasElement, args }) => {
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Bora olhar até 20 km" }));
    await expect(args.onExpand).toHaveBeenCalledWith(20);
  },
};
export const Atualizando: Story = { args: { isFetching: true } };
export const SemEndereco: Story = {
  args: { items: [], totalCount: 0, error: { code: "LISTING_SEARCH_ADDRESS_REQUIRED", status: 422, fields: {} } },
};
export const Erro: Story = { args: { error: { code: "LISTING_GEOCODER_UNAVAILABLE", status: 503, fields: {} } } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
