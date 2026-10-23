import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { searchPetsFixture } from "@/test/fixtures/search";
import { SearchFilterBar } from "./SearchFilterBar";

const meta = {
  title: "Search/SearchFilterBar",
  component: SearchFilterBar,
  parameters: {
    design: { board: "Busca-Mapa" },
    nextjs: { appDirectory: true, navigation: { query: { where: "Maringá", hasYard: "true" } } },
  },
  args: { pets: searchPetsFixture },
} satisfies Meta<typeof SearchFilterBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const SemBusca: Story = { parameters: { nextjs: { appDirectory: true, navigation: { query: {} } } } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
