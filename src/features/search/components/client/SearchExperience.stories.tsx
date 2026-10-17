import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { ReadonlyURLSearchParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { listingFixture, searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";
import { searchQueries } from "../../api/queries";
import { SearchExperience } from "./SearchExperience";

const query = searchQueryFixture();
const meta = {
  title: "Search/SearchExperience",
  component: SearchExperience,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { accountId: "story-owner", initialQuery: query, today: "2026-10-15", pets: searchPetsFixture },
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
} satisfies Meta<typeof SearchExperience>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ComPets: Story = {};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
