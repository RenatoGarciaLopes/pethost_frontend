import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FilterChips } from "./FilterChips";
import { searchPetsFixture, searchQueryFixture } from "@/test/fixtures/search";

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
  args: { query: searchQueryFixture({ hasYard: true, hasKids: false }) },
};

export const ComPet: Story = {
  args: { pets: searchPetsFixture, query: searchQueryFixture({ pets: [searchPetsFixture[0]!.id] }) },
};
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
