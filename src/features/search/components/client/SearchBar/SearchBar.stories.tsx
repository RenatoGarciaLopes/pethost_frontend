import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SearchBar } from "./SearchBar";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";

const meta = {
  title: "Search/SearchBar",
  component: SearchBar,
  parameters: { design: { board: "Busca-Mapa" } },
  args: { query: searchQueryFixture(), pets: searchPetsFixture, today: "2026-10-15", onSearch: () => {} },
} satisfies Meta<typeof SearchBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const SemPets: Story = { args: { pets: [] } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
