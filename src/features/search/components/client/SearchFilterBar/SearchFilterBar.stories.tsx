import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ReadonlyURLSearchParams, useSearchParams } from "@storybook/nextjs-vite/navigation.mock";
import { searchPetsFixture } from "@/test/fixtures/search";
import { SearchFilterBar } from "./SearchFilterBar";

const meta = {
  title: "Search/SearchFilterBar",
  component: SearchFilterBar,
  parameters: { design: { board: "Busca-Mapa" }, query: { where: "Maringá", hasYard: "true" } },
  args: { pets: searchPetsFixture },
  beforeEach: ({ parameters }) => {
    // Mock do framework: appDirectory ainda usa contexto anterior ao Next 16.4.
    useSearchParams.mockReturnValue(new ReadonlyURLSearchParams(parameters.query));
  },
} satisfies Meta<typeof SearchFilterBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
export const SemBusca: Story = { parameters: { query: {} } };
export const Celular: Story = { globals: { viewport: { value: "celular", isRotated: false } } };
