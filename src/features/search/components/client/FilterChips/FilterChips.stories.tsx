import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FilterChips } from "./FilterChips";
import { searchQueryFixture } from "@/test/fixtures/search";

const meta = {
  title: "Search/FilterChips",
  component: FilterChips,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { query: searchQueryFixture(), onChange: () => {} },
} satisfies Meta<typeof FilterChips>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const Ativos: Story = {
  args: { query: searchQueryFixture({ hasYard: true, hasKids: false, maxNightlyRate: 80 }) },
};
