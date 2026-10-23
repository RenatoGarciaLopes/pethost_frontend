import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { quintalRadii } from "@/shared/theme/tokens/radii";
import { searchQueries } from "../../api/queries";
import { SearchResultsSection } from "./SearchResultsSection";

const query = searchQueryFixture();
const meta = {
  title: "Search/SearchResultsSection",
  component: SearchResultsSection,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { accountId: "story-owner", initialQuery: query, pets: searchPetsFixture },
  beforeEach: () => {
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams());
  },
  decorators: [
    (Story) => {
      const client = new QueryClient({
        defaultOptions: { queries: { staleTime: Infinity, enabled: false, retry: false } },
      });
      client.setQueryData(searchQueries.infinite("story-owner", query, searchPetsFixture).queryKey, {
        pages: [{ items: [listingFixture()], page: 1, pageSize: 12, totalCount: 1 }],
        pageParams: [1],
      });
      return (
        <QueryClientProvider client={client}>
          <Story />
        </QueryClientProvider>
      );
    },
  ],
} satisfies Meta<typeof SearchResultsSection>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ComPets: Story = {};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
export const ComMapa: Story = {
  args: {
    map: (
      <div
        style={{
          minHeight: 320,
          border: "2px dashed currentColor",
          borderRadius: quintalRadii.card,
          display: "grid",
          placeItems: "center",
        }}
      >
        Mapa (080)
      </div>
    ),
  },
};
